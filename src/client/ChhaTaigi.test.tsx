import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MainDisplayAreaMode} from "./types/displayTypes";
import {ChhaTaigi} from './ChhaTaigi';
import OptionsChangeableByUser from './ChhaTaigiOptions';
import * as React from 'react';
import '@testing-library/jest-dom/extend-expect';
import {noop} from './utils';
import {SearcherType} from './search/searchers/Searcher';
import {AnnotatedPerDictResults, annotateRawResults, DBSearchRanking, PerDictResultsRaw} from './types/dbTypes';
import AppConfig from './configHandler/AppConfig';
import {genLoadFinalConfigWILLTHROW} from '../scripts/compileYamlLib';

import QueryStringHandler from "./QueryStringHandler";;

// NOTE: just used to silence errors in node TSC.
noop(React.version);

// TODO(high): test basic worker search behavior (probably not possible from jest?)
// TODO(low): figure out how to run componentDidMount
// TODO(later): migrate to createRoot - right now, using it crashes the test runner.

test('render searchbar by default', async () => {
    const appID = "test/simpletest";
    const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride: [appID]});
    let options = new OptionsChangeableByUser();
    options.appID = appID;
    const app = <ChhaTaigi rfc={rfc} mockOptions={options} />;
    render(app,
        // @ts-ignore
        {legacyRoot: true}
    );

    const searchBar = screen.getByPlaceholderText(/Search.../);
    expect(searchBar).toBeInTheDocument();
    expect(searchBar).toBeEmptyDOMElement();
    // XXX TODO: react-burger-menu broke this, and a timeout hack is being used which doesn't work with this test
    //expect(searchBar).toHaveFocus();
});

test('render single entry via override', async () => {
    // The app needs to be taigi.us here, because app-specific display settings are used
    const appID = "taigi.us";
    let options = new OptionsChangeableByUser();
    options.appID = appID;
    options.mainMode = MainDisplayAreaMode.SEARCH;

    const perDictRes = getExampleTaigiRes();

    const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride: [appID]});

    const appConfig = AppConfig.from(rfc, appID, null);
    const annotatedResRaw = annotateRawResults(perDictRes, appConfig);
    const annotatedRes = new AnnotatedPerDictResults(annotatedResRaw);

    const app = <ChhaTaigi mockOptions={options} rfc={rfc} mockResults={annotatedRes} />;
    render(app,
        // @ts-ignore
        {legacyRoot: true}
    );

    const tcn = screen.getByText(/法律/i);
    expect(tcn).toBeInTheDocument();

    const poj = screen.getByText(/lu̍t/i);
    expect(poj).toBeInTheDocument();

    const pojNoMatch = screen.queryByText(/hoat-lu̍t/i);
    expect(pojNoMatch).toBeNull();

    const eng = screen.getByText(/the law/i);
    expect(eng).toBeInTheDocument();

    // TODO: display DB again at some point, possibly in debug mode
    //const db = screen.getByText(/TaioanPehoeKichhooGiku/i);
    //expect(db).toBeInTheDocument();
    const searchBar = screen.getByPlaceholderText(/Search.../);
    expect(searchBar).toBeInTheDocument();
});

test('do not render unknown fields', async () => {
    // Because there's no overlap in the field names of these apps, we should not see anything.
    const appID = "test/simpletest";
    let options = new OptionsChangeableByUser();
    options.appID = appID;
    options.mainMode = MainDisplayAreaMode.SEARCH;

    const perDictRes = getExampleTaigiRes();

    const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride: [appID]});

    const appConfig = AppConfig.from(rfc, appID, null);
    const annotatedResRaw = annotateRawResults(perDictRes, appConfig);
    const annotatedRes = new AnnotatedPerDictResults(annotatedResRaw);

    const app = <ChhaTaigi mockOptions={options} rfc={rfc} mockResults={annotatedRes} />;
    render(app,
        // @ts-ignore
        {legacyRoot: true}
    );

    const tcn = screen.queryByText(/法律/i);
    expect(tcn).toBeNull();

    const poj = screen.queryByText(/lu̍t/i);
    expect(poj).toBeNull();

    const eng = screen.queryByText(/the law/i);
    expect(eng).toBeNull();

    const searchBar = screen.getByPlaceholderText(/Search.../);
    expect(searchBar).toBeInTheDocument();
});


test('render license page', async () => {
    const qs = new QueryStringHandler();
    const qsUpdateMock = jest.spyOn(qs, 'update');
    const user = userEvent.setup();
    const appID = "test/simpletest_with_subapps";
    let options = new OptionsChangeableByUser();
    options.appID = appID;

    const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride: [appID]});

    const app = <ChhaTaigi mockOptions={options} rfc={rfc} qs={qs} />;
    render(app,
        // @ts-ignore
        {legacyRoot: true}
    );

    const licensesLinkText = /licenses/i;
    const licenseText = /TEST LICENSE OKAY/;
    const sourceText = /https:\/\/testurlokay.com/;

    const licenses = screen.getByText(licensesLinkText);
    expect(licenses.tabIndex).toBe(-1);

    const noAngryLicense = screen.queryByText(licenseText);
    expect(noAngryLicense).toBe(null);

    const noAngrySource = screen.queryByText(sourceText);
    expect(noAngrySource).toBe(null);

    const menuBtn = screen.getByText("Open Menu");
    await user.click(menuBtn);

    await waitFor(async () => {
        const licensesAfter = screen.getByText(licensesLinkText);
        expect(licensesAfter.tabIndex).toBe(0);

        await user.click(licensesAfter);
    });

    await waitFor(async () => {
        const angryLicense = screen.getByText(licenseText);
        expect(angryLicense).toBeInTheDocument();

        const angrySource = screen.queryByText(sourceText);
        expect(angrySource).toBeInTheDocument();
        expect(qsUpdateMock).toHaveBeenCalledWith({"mainMode": "PAGE", "pageID": "licenses"}, {"modifyHistInPlace": true});
    });
});

test('render sample page', async () => {
    const qs = new QueryStringHandler();
    const qsUpdateMock = jest.spyOn(qs, 'update');
    const user = userEvent.setup();
    const appID = "test/simpletest_with_page";
    let options = new OptionsChangeableByUser();
    options.appID = appID;

    const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride: [appID]});

    const app = <ChhaTaigi mockOptions={options} rfc={rfc} qs={qs} />;
    render(app,
        // @ts-ignore
        {legacyRoot: true}
    );

    const samplePageLinkText = /sample/i;
    const samplePageText = /test page text!/;

    const samplePageLink = screen.getByText(samplePageLinkText);
    expect(samplePageLink.tabIndex).toBe(-1);

    const noSamplePageTextContents = screen.queryByText(samplePageText);
    expect(noSamplePageTextContents).toBe(null);

    const menuBtn = screen.getByText("Open Menu");
    await user.click(menuBtn);

    await waitFor(async () => {
        const samplePageLinkAfter = screen.getByText(samplePageLinkText);
        expect(samplePageLinkAfter.tabIndex).toBe(0);

        await user.click(samplePageLinkAfter);
    });

    await waitFor(async () => {
        const samplePageTextContents = screen.getByText(samplePageText);
        expect(samplePageTextContents).toBeInTheDocument();
        expect(qsUpdateMock).toHaveBeenCalledWith({"mainMode": "PAGE", "pageID": "sample"}, {"modifyHistInPlace": true});
    });
});

// TODO: test for about/eng_us.md etc
// TODO: test for display of links in particular languages

function getExampleTaigiRes(): PerDictResultsRaw {
    const dbIdentifier = "ChhoeTaigi_TaioanPehoeKichhooGiku";
    const rowID = 1;

    const marked = `hoat-<mark>lu̍t</mark>`;

    const dbSearchRanking: DBSearchRanking = {searcherType: SearcherType.REGEX, score: -3};
    let res1 = {
        key: `${dbIdentifier}-${rowID}`,
        rowID,
        dbIdentifier,
        dbSearchRanking,
        fields: [
            {
                colName: "PojUnicode",
                value: "hoat-lu̍t",
                matched: true,
                displayValOverride: marked,
            },
            {
                colName: "PojInput",
                value: "hoat-lut8",
                matched: false,
            },
            {
                colName: "HoaBun",
                value: "法律",
                matched: false,
            },
            {
                colName: "PojNormalized",
                value: "hoat-lut",
                matched: false,
            },
            {
                colName: "EngBun",
                value: "the law",
                matched: false,
            },
        ],
    };

    return {
        dbIdentifier,
        results: [res1],
    };
}
