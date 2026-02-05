# IT Support Guide

# WiFi Integration
Network Name: CW-Secure
Authentication: Use your domain username (firstname.lastname) and password.
Certificate: Accept the 'CORPWISE-ROOT-CA' certificate if prompted.
Guest Network: CW-Guest (Open authentication, requires splash page acceptance).

# VPN Access
Client: Cisco AnyConnect
Server Address: vpn.corpwise.internal
MFA: Push notification via Duo Mobile is required for all connections.
Troubleshooting: If connection fails, try switching regions (East-1 vs West-2) in the dropdown.

# Password Policy
Requirement: Minimum 14 characters, mixed case, numbers, and symbols.
Expiration: Passwords expire every 90 days.
Reset Portal: https://idm.corpwise.internal/reset (Accessible from mobile).

# Device Security
Encryption: BitLocker must be enabled on all Windows laptops.
Updates: Security patches are forced every Thursday night (Patch Tuesday).
Software Center: Use 'Company Portal' app to install approved software (VS Code, Docker, Slack). Do not download installers from the web.
