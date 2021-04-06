import React, {Component} from "react";
import ReactDOM from "react-dom";
import fuzzysort from "fuzzysort";

import "./cha_taigi.css";

// TODO(urgent): use delimiters instead of dangerouslySetInnerHTML
// TODO(high): Copy to clipboard on click or tab-enter
// TODO(high): have search updates appear asynchronously from typing
// TODO(high): use <mark></mark> instead of individual spans
// TODO(low): have GET param for search (and options?)
// TODO(low): store options between sessions
// TODO(low): radio buttons of which text to search
// TODO(wishlist): dark mode support
// TODO(wishlist): non-javascript support?

const poj = [];

//const rem_url = "maryknoll_smaller.json";
const rem_url = "maryknoll_normalized_minified.json"


const Taigi = ({poj_unicode, english, poj_normalized}) => {

  // FIXME(https://github.com/farzher/fuzzysort/issues/66)
  const html_poj_unicode = {__html: poj_unicode};
  const html_poj_normalized = {__html: poj_normalized};
  const html_english = {__html: english};
  const poju = <span className="poj-unicode" dangerouslySetInnerHTML={html_poj_unicode}></span>;
  const pojn = <span className="poj-normalized" dangerouslySetInnerHTML={html_poj_normalized}></span>;
  const engl = <span className="english-definition" dangerouslySetInnerHTML={html_english}></span>;
  return (
    <div className="entry-container">
      <div className="poj-normalized-container">
        {pojn}
      </div> 
      <div className="poj-unicode-container">
        {poju}
      </div> 
      <div className="english-container">
        {engl}
      </div>
    </div>
  );
};

const loaded_placeholder = <div className="placeholder">Type to search!</div>;
const loading_placeholder = <div className="placeholder">Loading...</div>;

const searchBar = (onChange) => {
    return <div className="search-bar">
      <input autoFocus={true} placeholder="Search..." onChange={onChange} />
      <svg aria-hidden="true" className="mag-glass" ><path d="M18 16.5l-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z"></path></svg>
    </div>
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      query: "",
      searching: false,
      results: null,
    };
    this.local_poj = poj;
    this.fuzzysort = fuzzysort;
    this.timeout = 0;
    this.placeholder = loading_placeholder;
    this.output = null;
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    fetch(rem_url)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        this.placeholder = loaded_placeholder;
        data.forEach(
          t => {
            t.poj_prepped = fuzzysort.prepare(t.poj_unicode);
            t.poj_norm_prepped = fuzzysort.prepare(t.poj_normalized);
            t.eng_prepped = fuzzysort.prepare(t.english);
          }
        )

        this.local_poj = data;
        this.setState(this.state);
      });

  }

  onChange(e) {
    const {target = {}} = e;
    const {value = ""} = target;

    this.update_query(value);
  }

  update_query(query) {
    this.setState({query, searching: true});

    const search_results = fuzzysort.go(
      query,
      this.local_poj,
      {
        keys: ["poj_norm_prepped", "eng_prepped", "poj_unicode"],
        allowTypo: false,
        limit: 50,
        threshold: -10000,
      },
    );
    this.setState({searching: false});

    const results = search_results
      .slice(0, 50)
      .map((x, i) => {
        const poj_norm_pre_paren = fuzzysort.highlight(x[0],
          "<span class=\"poj-normalized-matched-text\" class=hlsearch>", "</span>")
          || x.obj.poj_normalized;
        const poj_norm_high = "(" + poj_norm_pre_paren + ")";
        const eng_high = fuzzysort.highlight(x[1],
          "<span class=\"english-definition-matched-text\" class=hlsearch>", "</span>")
          || x.obj.english;
        const poj_unicode = fuzzysort.highlight(x[2],
          "<span class=\"poj-unicode-matched-text\" class=hlsearch>", "</span>")
          || x.obj.poj_unicode;
        return <Taigi key={i} poj_unicode={poj_unicode} english={eng_high} poj_normalized={poj_norm_high} />;

      })

    this.setState({results});
  }

  render() {
    const {onChange} = this;
    const {results, query} = this.state;
    
    // TODO: store boolean state of loading placeholder
    return (
      <div className="App">
        {searchBar(onChange)}
        <div className="placeholder-container">
          {query ? null : this.placeholder}
        </div>
        <div className="results-container">
          {results}
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
