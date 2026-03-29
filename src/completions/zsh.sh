#compdef emuku

_emuku() {
  local state

  _arguments \
    '1: :->platform' \
    '2: :->subcommand' \
    '3: :->action' \
    '4: :->target'

  case $state in
    platform)
      _describe 'platform' '(ios:iOS\ simulator\ commands android:Android\ emulator\ commands create:Setup\ prerequisites tools:Utility\ tools --help:Show\ help)'
      ;;
    subcommand)
      case ${words[2]} in
        ios|android)
          _describe 'subcommand' '(device:Device\ management)'
          ;;
        create)
          _describe 'platform' '(ios:Set\ up\ iOS android:Set\ up\ Android)'
          ;;
        tools)
          _describe 'tool' '(bash-completion:Install\ shell\ completions)'
          ;;
      esac
      ;;
    action)
      case ${words[2]} in
        ios|android)
          _describe 'action' '(list:List\ all\ devices start:Start\ a\ device)'
          ;;
      esac
      ;;
    target)
      case ${words[2]} in
        ios)
          if [[ ${words[3]} == device && ${words[4]} == start ]]; then
            local devices
            devices=($(xcrun simctl list devices -j 2>/dev/null | \
              python3 -c "
import json,sys
d=json.load(sys.stdin)
for rt in d.get('devices',{}).values():
  for dev in rt:
    if dev.get('isAvailable'):
      print(dev['udid'])
" 2>/dev/null))
            _describe 'device' devices
          fi
          ;;
        android)
          if [[ ${words[3]} == device && ${words[4]} == start ]]; then
            local avds
            avds=($(emulator -list-avds 2>/dev/null))
            _describe 'avd' avds
          fi
          ;;
      esac
      ;;
  esac
}

_emuku "$@"
