export default function getUnauthorizedErrorMessage(
  callerAddress: string,
  roleStr: any,
) {
  return `AccessControl: account ${callerAddress.toLowerCase()} is missing role ${roleStr.toLowerCase()}`;
}
