# HopeAid Frontend Login Error Codes

Login screen now shows a random numeric code with every failed login attempt.

## Code Groups

| Group | Random Codes | Trigger | Message Shown |
|---|---|---|---|
| Invalid Credentials | `101`, `104`, `109` | Wrong email/password | `Invalid credentials. Check your email and password.` |
| Role Mismatch | `201`, `207`, `212` | Selected login role does not match account role | Uses backend error text (role mismatch message) |
| Access Forbidden | `301`, `307`, `313` | Account lacks permission for chosen portal | `This account does not have access for the selected portal.` |
| Rate Limited | `429`, `430`, `431` | Too many login attempts | `Too many login attempts. Wait a bit and try again.` |
| Backend Unavailable | `500`, `502`, `503` | Backend/server unavailable | `Backend service is temporarily unavailable.` |
| Network Failure | `901`, `902`, `903` | Browser cannot reach server (`failed to fetch`) | `Network error while contacting the server.` |
| Unknown | `990`, `995`, `999` | Any other login error | Raw error message or fallback |

## Notes

- The code is randomly picked from the matched group for each failed attempt.
- UI format on login page: `Error code: <code>`.
- Full explanation is shown only when hovering/focusing the `i` info button.
