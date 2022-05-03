import * as React from "react";
import { render } from "react-dom";
import { dchanges } from "../../declarations/dchanges";

const App = () => {
  return (
    <section class="section">
        <div class="container">
            <h1 class="title">
                D-Changes
            </h1>
            <p class="subtitle">
                Together we can transform the world!
            </p>
        </div>
    </section>      
  );
};

render(<App />, document.getElementById("app"));