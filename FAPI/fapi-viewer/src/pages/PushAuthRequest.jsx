import { Container, Row, Col, Form, Button, InputGroup, Alert } from "react-bootstrap";
import { useEffect, useState } from "react";
import axios from "axios";
import * as jose from 'jose';

const PAR = () => {
    let pushAuthURL = "https://localhost:30003/oauth2/par";
    let redirectionURLVal = "http://localhost:3000/token"
    let scopeValue = "profile openid"
    let clientAssertionTypeValue = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
    let responseTypeValue = "code id_token";

    const [url, setUrl] = useState(pushAuthURL);
    const [clientId, setClientId] = useState('');
    const [redirectionUrl, setRedirectionUrl] = useState(redirectionURLVal);
    const [response, setResponse] = useState('{}');
    const [scope, setScope] = useState(scopeValue);
    const [clientAssertionType, setClientAssertionType] = useState(clientAssertionTypeValue);
    const [responseType, setResponseType] = useState(responseTypeValue);
    const [request, setRequest] = useState('{}');
    const [clientAssertion, setClientAssertion] = useState('{}');
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let requestValue = {
            "aud": "https://localhost:30003/oauth2/token",
            "scope": "account openid",
            "iss": clientId,
            "claims": {
                "sharing_duration": 50400,
                "id_token": {
                    "acr": {
                        "values": [
                            "urn:cds.au:cdr:3"
                        ],
                        "essential": true,

                    },
                    "family_name": { "essential": true },
                    "address": null,
                    "phone_number": null,
                    "phone_number_verified": null,
                    "email": { "essential": true }
                },
                "userinfo": {
                    "updated_at": {},
                    "name": {},
                    "given_name": { "essential": true }
                }
            },
            "response_type": "code id_token",
            "redirect_uri": redirectionUrl,
            "state": "suite",
            "nonce": "d69c15ce-ef11-49d9-a271-f7d0aa6f1a31",
            "client_id": clientId,
            "code_challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
            "code_challenge_method": "S256"
        };
        let clientAssertionValue = {
            "sub": clientId,
            "aud": "https://localhost:30003/oauth2/token",
            "iss": clientId,
            "jti": "dj4840290-2-2=9403"
        }
        setRequest(requestValue);
        setClientAssertion(clientAssertionValue);
    }, [clientId, redirectionUrl]);

    const handleSignRequest = async () => {
        const alg = 'PS256'
        const pkcs8 = `-----BEGIN PRIVATE KEY-----
        MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCiLsCJqXPwgO01
        3S3xoaOdNJKfJDaG66to6bqIDAeX5si4C9YCL/rtKAgvko8aaaqHQ3YA2Ln5dsbU
        rWcMcKo6NDeNKzZj1P//76gNm9uqOIRAjwarWyhqO3SNk87OXhAdKNDBsCPxS1Tn
        cp1+cqzNfj4izTr0U1Es84kkQVSe4upoztnRwdB7W9zn/MiDdrNU2tFPmDSHA3dF
        eGX8fYOLy8CAkoVqILPepTojEOxx/0NrCe59t9HAUgdF0fGRPaAsUz93LII0wfT7
        l9n9lVQoyYeNHLG4f/cqTqiHVnOJPKV8cHNYqGZpA2h3D5645FBLKOhIx8P+vsoZ
        dMBMRRPRAgMBAAECggEACKFjRpAZZtl9hgnEmaCn48Q57zUOn8RnxTf24Kl/N/Kk
        iMK8ezZRbJBeSyXJ7rZjyDnrTCU8VE2hTA0EOFHAhUNlF2KOzOY3T0fSEhNSr669
        PvA9gx3hOzH5xFTywuGXiu2ymjQE3aDMHlrnjaSNlIvcw55XPkw2vCUjjaXaWnAU
        DwyWEEJvUpleqq/boUaQe8DTnuxmRStSd6dhFopR8T+m5LaxrM3cGd/FkqTyiLmR
        Ilv1LwaxGwvEcpUcnmEcoVXTSBvn9r0LdTwD3EDVdoziPaf31yuGsW8UDEziyBnu
        4xgUv8iCUmgsM3U6at5FL47AdaRhGIN9ZN3HlTFdAQKBgQDgQ+uyJuzFdmayZOkN
        cSFmsNlPdzavRlRH6jNNcJNVM3DIQa4c4gsJeMxxRh4YyFzQKanCrdJiucbTzlAO
        c/R82EBU+tmkvlCVk1zzt+DnXwDvUmen92ur7zZgfkfARwtCIwatYjgMu5cZV8fB
        92KbsSV4z+r7D5ch3xcH+o3JIQKBgQC5Id34vHMT+Oe2o1Y2Ydpv43EXkrfUopmO
        o1QEG/ExRrsxeYlSJKes1vko/jx5w/rETMiMyAOquRxcJOwgTFJGtqj74y/h2zox
        w/Odw9+ua7nt0Q/ghvPJFjBcDBJmsrUBDtYFP2vUA1gT/B/50TOZO/MQmpqXwr0U
        cAMtu4iEsQKBgBwEAB6qRCvKxbuFZaO7PTvx3cPSla9Brueo9y22YYFkQrORmOmc
        x1owkAGai8n2xblvaviZ9E1G/fKZtGCJ1cH+1dKH38Z3y+NTnGoJz3u334sGFVLj
        Ur0Qzg8x107K0To62+uu+GeGy7Jrx9WQTO48K/0ypB0m7m9ZyivB/hJhAoGAe9ay
        xBNTK1YBsgNaxS/5zYSn/uvO+nb2HxsUNVd3pM26pGK3P/JzE0QOEaTXUWCOW0c9
        lCarhUUkOmMcbJKBKvo+2ZfkTMG4ENgSG0OOWf+HtRR2+WtsoeOs37XXjUkXmSiS
        c5o0B/NgtKWfwh111ZfrhPzWUpQapRQ0nB/pN1ECgYEAsayhkSeZCqR/Jr9fn3+8
        QteXPGCDnKuDo60nrtNDAhEsPWzwhyOlELTExJKo10EL9CtZAXnVdhxQ7Z27oFNc
        9SWTijo2WRDa6s8J86NBtI2kSMlLBjxFzMZe4+Glf5+gc80EvOEd8SUfi2qf2s2v
        qI3VtYg2YJoIZcTutyY2AN4=
        -----END PRIVATE KEY-----`
        const privateKey = await jose.importPKCS8(pkcs8, alg)

        const jwt = await new jose.SignJWT(request)
            .setProtectedHeader({ alg })
            .setIssuedAt()
            .setIssuer(clientId)
            .setAudience("https://localhost:30003/oauth2/token")
            .setExpirationTime('3600S')
            .sign(privateKey)

        setRequest(jwt);
    };

    const handleSignAssersion = async () => {
        const alg = 'PS256'
        const pkcs8 = `-----BEGIN PRIVATE KEY-----
        MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCiLsCJqXPwgO01
        3S3xoaOdNJKfJDaG66to6bqIDAeX5si4C9YCL/rtKAgvko8aaaqHQ3YA2Ln5dsbU
        rWcMcKo6NDeNKzZj1P//76gNm9uqOIRAjwarWyhqO3SNk87OXhAdKNDBsCPxS1Tn
        cp1+cqzNfj4izTr0U1Es84kkQVSe4upoztnRwdB7W9zn/MiDdrNU2tFPmDSHA3dF
        eGX8fYOLy8CAkoVqILPepTojEOxx/0NrCe59t9HAUgdF0fGRPaAsUz93LII0wfT7
        l9n9lVQoyYeNHLG4f/cqTqiHVnOJPKV8cHNYqGZpA2h3D5645FBLKOhIx8P+vsoZ
        dMBMRRPRAgMBAAECggEACKFjRpAZZtl9hgnEmaCn48Q57zUOn8RnxTf24Kl/N/Kk
        iMK8ezZRbJBeSyXJ7rZjyDnrTCU8VE2hTA0EOFHAhUNlF2KOzOY3T0fSEhNSr669
        PvA9gx3hOzH5xFTywuGXiu2ymjQE3aDMHlrnjaSNlIvcw55XPkw2vCUjjaXaWnAU
        DwyWEEJvUpleqq/boUaQe8DTnuxmRStSd6dhFopR8T+m5LaxrM3cGd/FkqTyiLmR
        Ilv1LwaxGwvEcpUcnmEcoVXTSBvn9r0LdTwD3EDVdoziPaf31yuGsW8UDEziyBnu
        4xgUv8iCUmgsM3U6at5FL47AdaRhGIN9ZN3HlTFdAQKBgQDgQ+uyJuzFdmayZOkN
        cSFmsNlPdzavRlRH6jNNcJNVM3DIQa4c4gsJeMxxRh4YyFzQKanCrdJiucbTzlAO
        c/R82EBU+tmkvlCVk1zzt+DnXwDvUmen92ur7zZgfkfARwtCIwatYjgMu5cZV8fB
        92KbsSV4z+r7D5ch3xcH+o3JIQKBgQC5Id34vHMT+Oe2o1Y2Ydpv43EXkrfUopmO
        o1QEG/ExRrsxeYlSJKes1vko/jx5w/rETMiMyAOquRxcJOwgTFJGtqj74y/h2zox
        w/Odw9+ua7nt0Q/ghvPJFjBcDBJmsrUBDtYFP2vUA1gT/B/50TOZO/MQmpqXwr0U
        cAMtu4iEsQKBgBwEAB6qRCvKxbuFZaO7PTvx3cPSla9Brueo9y22YYFkQrORmOmc
        x1owkAGai8n2xblvaviZ9E1G/fKZtGCJ1cH+1dKH38Z3y+NTnGoJz3u334sGFVLj
        Ur0Qzg8x107K0To62+uu+GeGy7Jrx9WQTO48K/0ypB0m7m9ZyivB/hJhAoGAe9ay
        xBNTK1YBsgNaxS/5zYSn/uvO+nb2HxsUNVd3pM26pGK3P/JzE0QOEaTXUWCOW0c9
        lCarhUUkOmMcbJKBKvo+2ZfkTMG4ENgSG0OOWf+HtRR2+WtsoeOs37XXjUkXmSiS
        c5o0B/NgtKWfwh111ZfrhPzWUpQapRQ0nB/pN1ECgYEAsayhkSeZCqR/Jr9fn3+8
        QteXPGCDnKuDo60nrtNDAhEsPWzwhyOlELTExJKo10EL9CtZAXnVdhxQ7Z27oFNc
        9SWTijo2WRDa6s8J86NBtI2kSMlLBjxFzMZe4+Glf5+gc80EvOEd8SUfi2qf2s2v
        qI3VtYg2YJoIZcTutyY2AN4=
        -----END PRIVATE KEY-----`
        const privateKey = await jose.importPKCS8(pkcs8, alg)

        const jwt = await new jose.SignJWT(clientAssertion)
            .setProtectedHeader({ alg })
            .setIssuedAt()
            .setIssuer(clientId)
            .setAudience("https://localhost:30003/oauth2/token")
            .setExpirationTime('3600S')
            .sign(privateKey)

        setClientAssertion(jwt);
    };

    async function submitPushAuthRequest() {
        let form = {
            "client_id": clientId,
            "redirect_uri": redirectionUrl,
            "scope": scope,
            "request": request,
            "client_assertion": clientAssertion,
            "client_assertion_type": clientAssertionType,
            "response_type": responseType
        };
        const headers = {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };
        try {
            const result = await axios.post(url, form, headers);
            setResponse(JSON.stringify(result.data, null, 2));
        } catch (e) {
            setErrorMessage(e.request.responseText);
            setShowError(true);
        }
    }

    async function handleIdToken() {
        const requestUri = JSON.parse(response).request_uri;
        const url = "https://localhost:30003";
        const authurl = `${url}/oauth2/authorize?client_id=${clientId}&request_uri=${requestUri}`;
        // Redirect to the authorization URL
        window.location.href = authurl;
    }

    return (
        <Container>
            <Row className="mb-3">
                <Col md={12} style={{ display: 'flex', justifyContent: 'left' }} >
                    <h1>Push Authorization Request</h1>
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
                <Col md={6} >
                    <InputGroup>
                        <InputGroup.Text id="basic-addon3">
                            URL
                        </InputGroup.Text>
                        <Form.Control id="basic-url" aria-describedby="basic-addon3" value={url} onChange={event => setUrl(event.target.value)} />
                    </InputGroup>
                </Col>
                <Col md={6} style={{ display: 'flex', justifyContent: 'left' }} >
                    <Button as="input" type="button" value="Send" onClick={submitPushAuthRequest} />
                </Col>
            </Row>
            <Row className="mb-3">
                <Col md={4}>
                    <InputGroup>
                        <InputGroup.Text id="basic-addon3">
                            ClientID
                        </InputGroup.Text>
                        <Form.Control id="basic-url" aria-describedby="basic-addon3" value={clientId} onChange={event => setClientId(event.target.value)} />
                    </InputGroup>
                </Col>
                <Col md={4}>
                    <InputGroup>
                        <InputGroup.Text id="basic-addon3">
                            Redirection URL
                        </InputGroup.Text>
                        <Form.Control id="basic-url" aria-describedby="basic-addon3" value={redirectionUrl} onChange={event => setRedirectionUrl(event.target.value)} />
                    </InputGroup>
                </Col>
                <Col md={4}>
                    <InputGroup>
                        <InputGroup.Text id="basic-addon3">
                            Scope
                        </InputGroup.Text>
                        <Form.Control id="basic-url" aria-describedby="basic-addon3" value={scope} onChange={event => setScope(event.target.value)} />
                    </InputGroup>
                </Col>
            </Row>
            <Row className="mb-3">
                <Col md={6} style={{ display: 'flex', justifyContent: 'left' }} >
                    <Button as="input" type="button" value="Sign Request" onClick={handleSignRequest} />
                </Col>
                <Col md={6} style={{ display: 'flex', justifyContent: 'left' }} >
                    <Button as="input" type="button" value="Sign Assertion" onClick={handleSignAssersion} />
                </Col>
            </Row>
            <Row className="mb-3">
                <Col md={6}>
                    <InputGroup>
                        <InputGroup.Text id="basic-addon3">
                            Request
                        </InputGroup.Text>
                        <Form.Control as="textarea" aria-label="With textarea" rows={8} value={JSON.stringify(request, null, 2)} onChange={event => setRequest(event.target.value)} readOnly="true" />
                    </InputGroup>
                </Col>
                <Col md={6} >
                    <InputGroup>
                        <InputGroup.Text id="basic-addon3">
                            Client Assertion
                        </InputGroup.Text>
                        <Form.Control as="textarea" aria-label="With textarea" rows={8} value={JSON.stringify(clientAssertion, null, 2)} onChange={event => setClientAssertion(event.target.value)} readOnly="true" />
                    </InputGroup>
                </Col>
            </Row>
            <Row className="mb-3">
                <Col md={6}>
                    <InputGroup>
                        <InputGroup.Text id="basic-addon3">
                            Client Assertion Type
                        </InputGroup.Text>
                        <Form.Control id="basic-url" aria-describedby="basic-addon3" value={clientAssertionType} onChange={event => setClientAssertionType(event.target.value)} />
                    </InputGroup>
                </Col>
                <Col md={6}>
                    <InputGroup>
                        <InputGroup.Text id="basic-addon3">
                            Response Type
                        </InputGroup.Text>
                        <Form.Control id="basic-url" aria-describedby="basic-addon3" value={responseType} onChange={event => setResponseType(event.target.value)} />
                    </InputGroup>
                </Col>
            </Row>
            <Row className="mb-3">
                <Col md={12}>
                    <InputGroup>
                        <InputGroup.Text>Request URI:</InputGroup.Text>
                        <Form.Control as="textarea" aria-label="With textarea" rows={10} value={response} readOnly="true" />
                    </InputGroup>
                </Col>
            </Row>
            <Row className="mb-3">
                <Col me={6}></Col>
                <Col md={6} style={{ display: 'flex', justifyContent: 'right' }} >
                    <Button as="input" type="button" value="Get ID Token" onClick={handleIdToken} />
                </Col>
            </Row>
        </Container>
    );
};

export default PAR;