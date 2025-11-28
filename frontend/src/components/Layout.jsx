import Navbar from './Navbar';
import Chatbot from './Chatbot';

const Layout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
                {children}
            </main>
            <Chatbot />
        </div>
    );
};

export default Layout;
