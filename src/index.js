"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var React = __importStar(require("react"));
var react_dom_1 = __importDefault(require("react-dom"));
var fuzzysort_1 = __importDefault(require("fuzzysort"));
var components_1 = require("./components");
require("./cha_taigi.css");
// TODO(urgent): use delimiters instead of dangerouslySetInnerHTML
// TODO(high): Migrate to TypeScript
// TODO(high): Fix clipboard notif not working on most browsers
// TODO(high): Fix typing before load not searching
// TODO(high): Copy to clipboard on click or tab-enter (allow for tab/hover enter/click focus equivalency?)
// TODO(high): have search updates appear asynchronously from typing
// TODO(high): use react-window or react-virtualized to only need to render X results at a time
// TODO(high): figure out why first search is slow, and if it can be sped up
// TODO(high): use <mark></mark> instead of individual spans
// TODO(high): create an index of all 3 categories combined, and search that as text?
// TODO(high): remove parentheses from unicode entries, treat as separate results
// TODO(high): let spaces match hyphens
// TODO(script the process of CSV -> processed JSON): remove parentheses from unicode, treat as separate results, chomp each result
// TODO(mid): keybinding for search (/)
// TODO(mid): button for "get all results", default to 10-20
// TODO(mid): visual indication that there were more results
// TODO(low): have GET param for search (and options?)
// TODO(low): prettier search/load indicators
// TODO(low): store options between sessions
// TODO(low): radio buttons of which text to search
// TODO(low): hoabun text click should copy hoabun?
// TODO(low): title
// TODO(low): copyright, links, etc
// TODO(low): fix the default/preview text
// TODO(wishlist): dark mode support
// TODO(wishlist): "add to desktop" shortcut
// TODO(wishlist): non-javascript support?
// TODO(later): generalize for non-english definition
var SEARCH_RESULTS_LIMIT = 20;
var DISPLAY_RESULTS_LIMIT = 20;
var EMPTY_SEARCH = { query: "", promise: null };
var rem_url = "maryknoll.json";
var SEARCH_KEYS = ["poj_normalized_prepped", "eng_prepped", "poj_prepped", "hoa_prepped"];
var fuzzyopts = {
    keys: SEARCH_KEYS,
    allowTypo: true,
    limit: SEARCH_RESULTS_LIMIT,
    threshold: -10000,
};
var App = /** @class */ (function (_super) {
    __extends(App, _super);
    function App(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            raw_results: [],
            results: [],
            dictionary_db: [],
            ongoing_search: EMPTY_SEARCH,
        };
        _this.onChange = _this.onChange.bind(_this);
        _this.createResultsForRender = _this.createResultsForRender.bind(_this);
        return _this;
    }
    App.prototype.componentDidMount = function () {
        var _this = this;
        fetch(rem_url)
            .then(function (response) {
            return response.json();
        })
            .then(function (data) {
            data.forEach(function (t) {
                // NOTE: prepareSlow does exist.
                // @ts-ignore
                t.poj_prepped = fuzzysort_1.default.prepareSlow(t.p);
                // @ts-ignore
                t.poj_normalized_prepped = fuzzysort_1.default.prepareSlow(t.n);
                // @ts-ignore
                t.eng_prepped = fuzzysort_1.default.prepareSlow(t.e);
                // @ts-ignore
                t.hoa_prepped = fuzzysort_1.default.prepareSlow(t.h);
            });
            _this.setState({
                dictionary_db: data,
            });
        });
    };
    App.prototype.onChange = function (e) {
        var _this = this;
        var _a = this.state, dictionary_db = _a.dictionary_db, ongoing_search = _a.ongoing_search;
        var _b = e.target, target = _b === void 0 ? {} : _b;
        var _c = target.value, value = _c === void 0 ? "" : _c;
        var query = value;
        if (query === "") {
            if (ongoing_search.promise != null) {
                ongoing_search.promise.cancel();
            }
            this.setState({ query: query, searching: false, ongoing_search: EMPTY_SEARCH });
            return;
        }
        var new_search_promise = fuzzysort_1.default.goAsync(query, dictionary_db, fuzzyopts);
        var new_search = { query: query, promise: new_search_promise };
        if (ongoing_search.promise != null) {
            ongoing_search.promise.cancel();
        }
        new_search.promise.cancel = new_search.promise.cancel.bind(new_search);
        new_search.promise.then(function (raw_results) {
            return _this.createResultsForRender(
            // @ts-ignore
            raw_results, query);
        }).catch(console.log);
        this.setState({
            query: query,
            searching: true,
            ongoing_search: new_search
        });
    };
    App.prototype.createResultsForRender = function (raw_results, query) {
        console.log("res", raw_results[0]);
        var results = raw_results
            .slice(0, DISPLAY_RESULTS_LIMIT)
            .map(function (fuzzysort_result, i) {
            // NOTE: See SEARCH_KEYS for order if confused.
            var poj_normalized_pre_highlight = fuzzysort_result[0];
            var english_pre_highlight = fuzzysort_result[1];
            var poj_unicode_pre_highlight = fuzzysort_result[2];
            var hoabun_pre_highlight = fuzzysort_result[3];
            var poj_norm_pre_paren = fuzzysort_1.default.highlight(poj_normalized_pre_highlight, "<span class=\"poj-normalized-matched-text\" class=hlsearch>", "</span>")
                || fuzzysort_result.obj.n;
            var poj_normalized = "(" + poj_norm_pre_paren + ")";
            var english = fuzzysort_1.default.highlight(english_pre_highlight, "<span class=\"english-definition-matched-text\" class=hlsearch>", "</span>")
                || fuzzysort_result.obj.e;
            var poj_unicode = fuzzysort_1.default.highlight(poj_unicode_pre_highlight, "<span class=\"poj-unicode-matched-text\" class=hlsearch>", "</span>")
                || fuzzysort_result.obj.p;
            var hoabun = fuzzysort_1.default.highlight(hoabun_pre_highlight, "<span class=\"hoabun-matched-text\" class=hlsearch>", "</span>")
                || fuzzysort_result.obj.h;
            var loc_props = {
                key: i,
                poj_unicode_text: fuzzysort_result.obj.p,
                poj_unicode: poj_unicode,
                hoabun: hoabun,
                poj_normalized: poj_normalized,
                english: english,
            };
            return jsx_runtime_1.jsx(components_1.EntryContainer, __assign({}, loc_props), void 0);
        });
        this.setState({ results: results, query: query, searching: false });
    };
    App.prototype.render = function () {
        var onChange = this.onChange;
        var _a = this.state, results = _a.results, query = _a.query, dictionary_db = _a.dictionary_db, searching = _a.searching;
        // TODO: store boolean state of loading placeholder
        return (jsx_runtime_1.jsxs("div", __assign({ className: "App" }, { children: [jsx_runtime_1.jsx(components_1.SearchBar, { onChange: onChange }, void 0),
                jsx_runtime_1.jsx(components_1.PlaceholderArea, { query: query, num_results: results.length, loaded: !!dictionary_db, searching: searching }, void 0),
                jsx_runtime_1.jsx(components_1.ResultsArea, { results: results, query: query, searching: searching }, void 0)] }), void 0));
    };
    return App;
}(React.Component));
var rootElement = document.getElementById("root");
react_dom_1.default.render(jsx_runtime_1.jsx(App, {}, void 0), rootElement);
