import { Container, Row, Col, Form, Button, InputGroup, Alert } from "react-bootstrap";
import { useState } from "react";
import axios from "axios";

const DCR = () => {
    // Public key from src/certs/wso2demo.cert (RSA 2048-bit).
    // Used as "enc" key so WSO2 can encrypt the id_token, and as "sig" key
    // so WSO2 can verify the client's signed request objects and assertions.
    const certPublicKey = {
        "kty": "RSA",
        "n": "oi7Aialz8IDtNd0t8aGjnTSSnyQ2huuraOm6iAwHl-bIuAvWAi_67SgIL5KPGmmqh0N2ANi5-XbG1K1nDHCqOjQ3jSs2Y9T__--oDZvbqjiEQI8Gq1soajt0jZPOzl4QHSjQwbAj8UtU53KdfnKszX4-Is069FNRLPOJJEFUnuLqaM7Z0cHQe1vc5_zIg3azVNrRT5g0hwN3RXhl_H2Di8vAgJKFaiCz3qU6IxDscf9DawnufbfRwFIHRdHxkT2gLFM_dyyCNMH0-5fZ_ZVUKMmHjRyxuH_3Kk6oh1ZziTylfHBzWKhmaQNodw-euORQSyjoSMfD_r7KGXTATEUT0Q",
        "e": "AQAB",
        "x5c": [
            "MIIDpTCCAo2gAwIBAgIUY9tqEixqsd5YpWc3afAb6qQlo74wDQYJKoZIhvcNAQELBQAwezELMAkGA1UEBhMCU0wxCzAJBgNVBAgMAldQMRAwDgYDVQQHDAdDb2xvbWJvMREwDwYDVQQKDAhXU08yIExMQzELMAkGA1UECwwCU0ExDjAMBgNVBAMMBVBhbW9kMR0wGwYJKoZIhvcNAQkBFg5wYW1vZEB3c28yLmNvbTAeFw0yNjA0MTYwNjMzMzNaFw0yNzA0MTYwNjMzMzNaMHsxCzAJBgNVBAYTAlNMMQswCQYDVQQIDAJXUDEQMA4GA1UEBwwHQ29sb21ibzERMA8GA1UECgwIV1NPMiBMTEMxCzAJBgNVBAsMAlNBMQ4wDAYDVQQDDAVQYW1vZDEdMBsGCSqGSIb3DQEJARYOcGFtb2RAd3NvMi5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCiLsCJqXPwgO013S3xoaOdNJKfJDaG66to6bqIDAeX5si4C9YCL/rtKAgvko8aaaqHQ3YA2Ln5dsbUrWcMcKo6NDeNKzZj1P//76gNm9uqOIRAjwarWyhqO3SNk87OXhAdKNDBsCPxS1Tncp1+cqzNfj4izTr0U1Es84kkQVSe4upoztnRwdB7W9zn/MiDdrNU2tFPmDSHA3dFeGX8fYOLy8CAkoVqILPepTojEOxx/0NrCe59t9HAUgdF0fGRPaAsUz93LII0wfT7l9n9lVQoyYeNHLG4f/cqTqiHVnOJPKV8cHNYqGZpA2h3D5645FBLKOhIx8P+vsoZdMBMRRPRAgMBAAGjITAfMB0GA1UdDgQWBBS4ARVL8I/cOFKxEpfENxwmWGASojANBgkqhkiG9w0BAQsFAAOCAQEASAWUMd9G2vJxF78A057vqD5evx9yndd0icCEPqp/1o65PIaldECqlUUPsuEOo60Gg/8mZ46TzsdC58AsV7Dtzrq+OXihs2SFsLQJTzpJHB6e4ewhFPBKIkXYvRr2LcvUsaTjwwpByILqwumOE0jshji2erR4B991KqWakTNmPaPnxp+n4oVrnOWd3pV6S6nxRi5mWkt/m0Y7dBOmp4AC68hXQgiqM70/TWMy276vIQuaOGbIMloZdNsLbv1pjvG9x0Rd7ltl0IurjiZUnBMBvLfXkBszlLDszIX4Z2ylIE+eCfGyfPaGwC7rJKq4IrzV1h0w6oavjs60t5PnmQZyNw=="
        ],
        "x5t": "DXGviW27z7KoqRouqmbRmbfRUvk",
        "x5t#S256": "ZWmzN48Ju_lYwL4qVCBXjGlTAk9nBlqn-OvUWyyMZ84"
    };

    let data = {
        "redirect_uris": [
            "http://localhost:3000",
            "http://localhost:3000/token",
        ],
        "client_name": "FAPI DCR app",
        "grant_types": [
            "client_credentials",
            "authorization_code"
        ],
        "response_types": [
            "code id_token"
        ],
        "backchannel_logout_uri": "http://localhost:3000/logout",
        "backchannel_logout_session_required": true,
        "token_endpoint_auth_signing_alg": "PS256",
        "sector_identifier_uri": "https://localhost:3000/v1/04b49547-0ae2-4049-8d1c-42648e633001",
        "id_token_signed_response_alg": "PS256",
        "id_token_encrypted_response_alg": "RSA-OAEP",
        "id_token_encrypted_response_enc": "A128GCM",
        "request_object_signing_alg": "PS256",
        "tls_client_auth_subject_dn": "CN=client.example.org, O=Client, L=Chiyoda-ku, ST=Tokyo, C=JP",
        "require_signed_request_object": true,
        "require_pushed_authorization_requests": true,
        "tls_client_certificate_bound_access_tokens": false,
        "subject_type": "pairwise",
        "request_object_encryption_alg": "RSA-OAEP",
        "request_object_encryption_enc": "A128GCM",
        "jwks": {
            "keys": [
                { ...certPublicKey, "use": "enc", "alg": "RSA-OAEP", "kid": "enc-wso2demo" },
                { ...certPublicKey, "use": "sig", "alg": "PS256",    "kid": "sig-wso2demo" }
            ]
        }
    };
    let dcrURL = "https://localhost:30003/api/identity/oauth2/dcr/v1.1/register"

    let username = "admin";
    let password = "admin";

    const [url, setUrl] = useState(dcrURL);
    const [body, setBody] = useState(JSON.stringify(data, null, 2));
    const [response, setResponse] = useState('{}');
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    async function submitRegistrationRequest(event) {
        const encodedCredentials = btoa(`${username}:${password}`);
        const authorizationHeader = {
            headers: { Authorization: `Basic ${encodedCredentials}`, "Content-Type": "application/json" }
        };
        try {
            const result = await axios.post(url, body, authorizationHeader);
            setResponse(JSON.stringify(result.data, null, 2));
        } catch (e) {
            setErrorMessage(e.request.responseText);
            setShowError(true);
        }
    }

    async function rediectToPAR(event) {
        const authurl = `http://localhost:3000/par`;
        // Redirect to the authorization URL
        window.location.href = authurl;
    }

    return (
        <Container>
            <Row className="mb-3" >
                <Col style={{ display: 'flex', justifyContent: 'left' }} >
                    <h1>Client Registration</h1>
                </Col>
            </Row>
            <Row>
                <Alert show={showError} variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>
                        {errorMessage}
                    </p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <Button onClick={() => setShowError(false)} variant="outline-error">
                            Close me
                        </Button>
                    </div>
                </Alert>
            </Row>
            <Row className="mb-3">
                <Col>
                    <InputGroup>
                        <InputGroup.Text id="basic-addon3">
                            URL
                        </InputGroup.Text>
                        <Form.Control id="basic-url" aria-describedby="basic-addon3" value={url} onChange={event => setUrl(event.target.value)} />
                    </InputGroup>
                </Col>
                <Col style={{ display: 'flex', justifyContent: 'left' }} >
                    <Button as="input" type="button" value="Request" onClick={submitRegistrationRequest} />
                </Col>
            </Row>
            <Row className="mb-3">
                <Col>
                    <InputGroup>
                        <InputGroup.Text>Body:</InputGroup.Text>
                        <Form.Control as="textarea" aria-label="With textarea" rows={10} value={body} onChange={event => setBody(event.target.value)} />
                    </InputGroup>
                </Col>
            </Row>
            <Row className="mb-3">
                <Col>
                    <InputGroup>
                        <InputGroup.Text>Response:</InputGroup.Text>
                        <Form.Control as="textarea" aria-label="With textarea" rows={10} value={response} readOnly="true" />
                    </InputGroup>
                </Col>
            </Row>
            <Row className="mb-3">
                <Col style={{ display: 'flex', justifyContent: 'right' }} >
                    <Button as="input" type="button" value="PAR Request" onClick={rediectToPAR} />
                </Col>
            </Row>
        </Container>
    );
}

export default DCR;