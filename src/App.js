import { Fragment } from 'react';
import { Scan } from './pages/scan'
import Home from './pages/home'
import { HashRouter, Route, Routes } from 'react-router-dom'


function App() {
  return (
    <Routes>
      <Route path="/" element={<Scan />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// 用来作为 404 页面的组件
const NotFound = () => {
  return <div>你来到了没有知识的荒原</div>
}

export default App;
