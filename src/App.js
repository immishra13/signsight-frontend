import { Route, Routes } from "react-router-dom";
import "./App.css";
import {
  Navbar,
  Footer,
  Home,
  Detect,
  Detection,   // make sure your components/index.js exports Detection
  NotFound,
  Dashboard,
  FloatingPPT,
} from "./components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ObjectDetection from "./components/ObjectDetection/ObjectDetection";

const notifyMsg = (type, msg) => {
  if (type === "success") toast.success(msg);
  else toast.error(msg);
};

const Layout = ({ children }) => {
  return (
    <>
      <Navbar notifyMsg={notifyMsg} />
      {children}
      <Footer />
      <FloatingPPT />
    </>
  );
};

function App() {
  return (
    <div className="App">
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />

        {/* Old learn page (keep if you still want it) */}
        <Route
          path="/detect"
          element={
            <Layout>
              <Detect />
            </Layout>
          }
        />

        {/* NEW Detection page */}
        <Route
          path="/detection"   // 👈 use all lowercase
          element={
            <Layout>
              <Detection />   {/* 👈 fixed: correct component name */}
            </Layout>
          }
        />

        {/* NEW Detection page */}
        <Route
          path="/objectdetection"   // 👈 use all lowercase
          element={
            <Layout>
              <ObjectDetection />   {/* 👈 fixed: correct component name */}
            </Layout>
          }
        />

        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <ToastContainer
        position="top-left"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
      />
    </div>
  );
}

export default App;
