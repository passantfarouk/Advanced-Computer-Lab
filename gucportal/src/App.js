import React, { Component } from 'react'
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './components/layout/Header';


class App extends Component {
  render(){
  return (
      <div className="app">
        <Header />
      </div>
  );
}
}
export default App;
