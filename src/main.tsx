import React from 'react'
import ReactDOM from 'react-dom/client'
import WorkspaceContainer from './WorkspaceContainer.tsx'
import './index.css'
import { getDefaultConfig, getEmptyWorkspaceProps } from './functions/workspaceInitializer.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WorkspaceContainer initialWorkspaceProps={getEmptyWorkspaceProps()} initialWorksapceConfig={getDefaultConfig()}/>
  </React.StrictMode>,
)

