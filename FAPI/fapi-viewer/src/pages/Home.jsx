import { Container, Row, Col, Button } from 'react-bootstrap';
import fapiImage from '../images/fapi.png';

const Home = () => {

    async function startFAPIFlow(){
        const authurl = `http://localhost:3000/dcr`;
        // Redirect to the authorization URL
        window.location.href = authurl;
    }

    return (
        <Container>
            <Row>
                <Col style={{ display: 'flex', justifyContent: 'center' }} >
                    <Button as="input" size="lg" variant="secondary" type="button" value="Start Flow" onClick={startFAPIFlow} />
                </Col>
            </Row>
            <Row>
                <img src={fapiImage} alt="Loading"  width="100%" height="50%" />
            </Row>
        </Container>
    );
};

export default Home;