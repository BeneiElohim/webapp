import React from 'react';
import Header from './Header';
import './Layout.css';

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main className="main">{children}</main>
    </>
  );
}
