import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />
      {/* Desktop: offset for sidebar. Mobile: offset for top + bottom bars */}
      <main className="md:ml-64 pt-0 md:pt-0 pb-24 md:pb-0 mt-14 md:mt-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
