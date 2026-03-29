_emuku_completions() {
  local cur prev words cword
  _init_completion 2>/dev/null || {
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
  }

  local word_count="${#COMP_WORDS[@]}"

  case "${COMP_WORDS[1]}" in
    ios)
      case "${COMP_WORDS[2]}" in
        device)
          case "${COMP_WORDS[3]}" in
            start)
              local devices
              devices=$(xcrun simctl list devices -j 2>/dev/null | \
                python3 -c "
import json,sys
d=json.load(sys.stdin)
for rt in d.get('devices',{}).values():
  for dev in rt:
    if dev.get('isAvailable'):
      print(dev['udid'])
      print(dev['name'])
" 2>/dev/null)
              COMPREPLY=($(compgen -W "$devices" -- "$cur"))
              ;;
            *)
              COMPREPLY=($(compgen -W "list start" -- "$cur"))
              ;;
          esac
          ;;
        *)
          COMPREPLY=($(compgen -W "device" -- "$cur"))
          ;;
      esac
      ;;
    android)
      case "${COMP_WORDS[2]}" in
        device)
          case "${COMP_WORDS[3]}" in
            start)
              local avds
              avds=$(emulator -list-avds 2>/dev/null || true)
              COMPREPLY=($(compgen -W "$avds" -- "$cur"))
              ;;
            *)
              COMPREPLY=($(compgen -W "list start" -- "$cur"))
              ;;
          esac
          ;;
        *)
          COMPREPLY=($(compgen -W "device" -- "$cur"))
          ;;
      esac
      ;;
    create)
      COMPREPLY=($(compgen -W "ios android" -- "$cur"))
      ;;
    tools)
      COMPREPLY=($(compgen -W "bash-completion" -- "$cur"))
      ;;
    *)
      COMPREPLY=($(compgen -W "ios android create tools --help -h" -- "$cur"))
      ;;
  esac
}

complete -F _emuku_completions emuku
