import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Submit } from "./pages/Submit";
import { Trial } from "./pages/Trial";
import { Report } from "./pages/Report";
import { Leaderboard } from "./pages/Leaderboard";
import { Litepaper } from "./pages/Litepaper";
import { Faq } from "./pages/Faq";
import { Trials } from "./pages/Trials";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/trial/:id" element={<Trial />} />
          <Route path="/trial/:id/report" element={<Report />} />
          <Route path="/trials" element={<Trials />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/litepaper" element={<Litepaper />} />
          <Route path="/faq" element={<Faq />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
