import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

export function MainLayout() {
    return (
        <div className="app-container">
            {/* 
                The background styles are handled by .app-container in index.css 
                (Radial gradients + Grid overlay)
             */}

            <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                height: '100%',
                overflow: 'hidden' // Main container doesn't scroll, children do
            }}>
                <Outlet />
            </div>

            {/* Global Toast Container could go here */}
        </div>
    );
}
