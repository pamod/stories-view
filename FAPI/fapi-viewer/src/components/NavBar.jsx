import { Navbar, Nav, Container } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';

const steps = [
    { path: '/dcr', label: '1. Register Client' },
    { path: '/par', label: '2. Push Auth Request' },
    { path: '/token', label: '3. Get Token' },
];

const AppNavBar = () => {
    const location = useLocation();

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
            <Container>
                <Navbar.Brand href="/" style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
                    FAPI Viewer
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="fapi-navbar" />
                <Navbar.Collapse id="fapi-navbar">
                    <Nav className="me-auto">
                        {steps.map(step => (
                            <Nav.Link
                                key={step.path}
                                href={step.path}
                                active={location.pathname === step.path}
                                style={location.pathname === step.path ? { fontWeight: 'bold' } : {}}
                            >
                                {step.label}
                            </Nav.Link>
                        ))}
                    </Nav>
                    <Nav>
                        <Nav.Link
                            href="https://openid.net/specs/openid-financial-api-part-2-1_0.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary"
                            style={{ fontSize: '0.85rem' }}
                        >
                            FAPI 2.0 Spec
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default AppNavBar;
