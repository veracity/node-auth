// tslint:disable: max-line-length

export const mockIdToken = {
	token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImVnRTgtX1JjUGROalRfWEZUNk05Z052clNvejl2N05yNkJyNHdrYkwxbWcifQ.eyJleHAiOjE1Njk0MTcyMTUsIm5iZiI6MTU2OTQxMzYxNSwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tL2E2ODU3MmUzLTYzY2UtNGJjMS1hY2RjLWI2NDk0MzUwMmU5ZC92Mi4wLyIsInN1YiI6Ik5vdCBzdXBwb3J0ZWQgY3VycmVudGx5LiBVc2Ugb2lkIGNsYWltLiIsImF1ZCI6IjNlNmQ1MTU0LTU3YzYtNGZiMi1hNTkxLTFmNTFiNmM3NzM5ZSIsImFjciI6ImIyY18xYV9zaWduaW53aXRoYWRmc2lkcCIsIm5vbmNlIjoiWTV3a3VvTkhKMjBaY1d0Mm42T3VLIiwiaWF0IjoxNTY5NDEzNjE1LCJhdXRoX3RpbWUiOjE1Njk0MTM2MTUsInVzZXJJZCI6ImFkNzQwMWNmLWI3MWYtNGEyYS1iMmNlLTBjNGZhMDI5ZmVmMiIsImdpdmVuX25hbWUiOiJkZW1vLXVzZXIiLCJmYW1pbHlfbmFtZSI6ImRlbW8tdXNlciIsIm5hbWUiOiJkZW1vLXVzZXIsIGRlbW8tdXNlciIsImRudmdsQWNjb3VudE5hbWUiOiJkZW1vLWFjY291bnQiLCJteURudmdsR3VpZCI6ImFkNzQwMWNmLWI3MWYtNGEyYS1iMmNlLTBjNGZhMDI5ZmVmMiIsIm9pZCI6IjZmMjQ2ZTM5LTY4YjQtNGY5NS05MjRiLTc4ZTA2OTQwNjlkZSIsImVtYWlsIjpbImRlbW8tdXNlci5kZW1vLXVzZXJAdmVyYWNpdHkuY29tIl0sInVwbiI6ImRlbW8tdXNlci5kZW1vLXVzZXJAdmVyYWNpdHkuY29tIiwiY19oYXNoIjoiYm9ya2l0eWJvcmsiLCJhdF9oYXNoIjoiSWpyVGQ1MnNRMFd0REZPNVBCYjF0QSJ9",
	idTokenDecoded: {
		header: {
			typ: "JWT",
			alg: "RS256",
			kid: "egE8-_RcPdNjT_XFT6M9gNvrSoz9v7Nr6Br4wkbL1mg"
		},
		payload: {
			exp: 1569417215,
			nbf: 1569413615,
			ver: "1.0",
			iss: "https://login.microsoftonline.com/a68572e3-63ce-4bc1-acdc-b64943502e9d/v2.0/",
			sub: "Not supported currently. Use oid claim.",
			aud: "3e6d5154-57c6-4fb2-a591-1f51b6c7739e",
			acr: "b2c_1a_signinwithadfsidp",
			nonce: "Y5wkuoNHJ20ZcWt2n6OuK",
			iat: 1569413615,
			auth_time: 1569413615,
			userId: "ad7401cf-b71f-4a2a-b2ce-0c4fa029fef2",
			given_name: "demo-user",
			family_name: "demo-user",
			name: "demo-user, demo-user",
			dnvglAccountName: "demo-account",
			myDnvglGuid: "ad7401cf-b71f-4a2a-b2ce-0c4fa029fef2",
			oid: "6f246e39-68b4-4f95-924b-78e0694069de",
			email: [
				"demo-user.demo-user@veracity.com"
			],
			upn: "demo-user.demo-user@veracity.com",
			c_hash: "IjrTd52sQ0WtDFO5PBb1tA",
			at_hash: "IjrTd52sQ0WtDFO5PBb1tA"
		},
		signature: "fake-signature"
	}
}

export const mockAccessToken = {
	accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImVnRTgtX1JjUGROalRfWEZUNk05Z052clNvejl2N05yNkJyNHdrYkwxbWcifQ.eyJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vYTY4NTcyZTMtNjNjZS00YmMxLWFjZGMtYjY0OTQzNTAyZTlkL3YyLjAvIiwiZXhwIjoxNTY5NDE3MjE1LCJuYmYiOjE1Njk0MTM2MTUsImF1ZCI6IjgzMDU0ZWJmLTFkN2ItNDNmNS04MmFkLWIyYmRlODRkN2I3NSIsInVzZXJJZCI6ImFkNzQwMWNmLWI3MWYtNGEyYS1iMmNlLTBjNGZhMDI5ZmVmMiIsImdpdmVuX25hbWUiOiJkZW1vLXVzZXIiLCJmYW1pbHlfbmFtZSI6ImRlbW8tdXNlciIsIm5hbWUiOiJkZW1vLXVzZXIsIGRlbW8tdXNlciIsImRudmdsQWNjb3VudE5hbWUiOiJkZW1vLWFjY291bnQiLCJteURudmdsR3VpZCI6ImFkNzQwMWNmLWI3MWYtNGEyYS1iMmNlLTBjNGZhMDI5ZmVmMiIsInN1YiI6Ik5vdCBzdXBwb3J0ZWQgY3VycmVudGx5LiBVc2Ugb2lkIGNsYWltLiIsIm9pZCI6ImRiYjMyOGNmLWFhZmYtNGJlMy1iMzFkLWZiNzJhOWFlZDNkNiIsImVtYWlsIjpbImRlbW8tdXNlci5kZW1vLXVzZXJAdmVyYWNpdHkuY29tIl0sInVwbiI6ImRlbW8tdXNlci5kZW1vLXVzZXJAdmVyYWNpdHkuY29tIiwibm9uY2UiOiJZNXdrdW9OSEoyMFpjV3QybjZPdUsiLCJzY3AiOiJ1c2VyX2ltcGVyc29uYXRpb24iLCJhenAiOiIzZTZkNTE1NC01N2M2LTRmYjItYTU5MS0xZjUxYjZjNzczOWUiLCJ2ZXIiOiIxLjAiLCJpYXQiOjE1Njk0MTM2MTV9",
	accessTokenDecoded: {
		header: {
			typ: "JWT",
			alg: "RS256",
			kid: "egE8-_RcPdNjT_XFT6M9gNvrSoz9v7Nr6Br4wkbL1mg"
		},
		payload: {
			iss: "https://login.microsoftonline.com/a68572e3-63ce-4bc1-acdc-b64943502e9d/v2.0/",
			exp: 1569417215,
			nbf: 1569413615,
			aud: "83054ebf-1d7b-43f5-82ad-b2bde84d7b75",
			userId: "ad7401cf-b71f-4a2a-b2ce-0c4fa029fef2",
			given_name: "demo-user",
			family_name: "demo-user",
			name: "demo-user, demo-user",
			dnvglAccountName: "demo-account",
			myDnvglGuid: "ad7401cf-b71f-4a2a-b2ce-0c4fa029fef2",
			sub: "Not supported currently. Use oid claim.",
			oid: "dbb328cf-aaff-4be3-b31d-fb72a9aed3d6",
			email: [
				"demo-user.demo-user@veracity.com"
			],
			upn: "demo-user.demo-user@veracity.com",
			nonce: "Y5wkuoNHJ20ZcWt2n6OuK",
			scp: "user_impersonation",
			azp: "3e6d5154-57c6-4fb2-a591-1f51b6c7739e",
			ver: "1.0",
			iat: 1569413615
		},
		signature: "fake-signature"
	}
}
