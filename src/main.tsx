import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import './index.css'
import App from './App.tsx'
import { DataSourceProvider } from './context/DataSourceContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataSourceProvider>
      <App />
    </DataSourceProvider>
  </StrictMode>,
)
