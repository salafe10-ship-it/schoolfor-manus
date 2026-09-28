export function getServerListenHost(isLocalStaging: boolean): '127.0.0.1' | '0.0.0.0' {
  return isLocalStaging ? '127.0.0.1' : '0.0.0.0';
}
