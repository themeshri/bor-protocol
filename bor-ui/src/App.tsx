import { Header } from './components/Header';
import { LiveStream } from './components/LiveStream';
import { ProfileModal } from './components/ProfileModal';
import { ToastContainer } from './components/Toast';
import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { SceneProvider } from './contexts/ScenesContext';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModalProvider } from './contexts/ModalContext';
import { DocsPage } from './components/DocsPage';


import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import SceneConfigurator from './components/SceneConfigurator';

const queryClient = new QueryClient();

import { SceneEngineProvider } from './contexts/SceneEngineContext';

export default function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      
              <Router>
                <UserProvider>
                  <SceneProvider>
                    <ModalProvider>
                      <SceneEngineProvider>
                          <Routes>
                            <Route path="/:modelName" element={<InnerApp />} />
                            <Route path="/" element={<InnerApp />} />
                            <Route path="/configure" element={<SceneConfigurator />} />
                            <Route path="/docs" element={<DocsPage />} />
                          </Routes>
                          <ProfileModal />
                          <ToastContainer />
                      </SceneEngineProvider>
                    </ModalProvider>
                  </SceneProvider>
                </UserProvider>
              </Router>

           
      </ThemeProvider>
    </QueryClientProvider>
  );
}


const InnerApp = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="flex flex-col h-screen overflow-hidden overscroll-none dark:bg-dark">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <div>
          {/* <Sidebar /> */}
        </div>
        <div className="flex-1 min-w-0">
          <LiveStream />
        </div>
      </div>
      {/*       <ProfileModal /> */}
       {/* <ToastContainer /> */}
      
      
    </div>
  )
}