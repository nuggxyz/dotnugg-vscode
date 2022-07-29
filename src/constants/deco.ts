import * as vscode from 'vscode';

const RedLine = vscode.window.createTextEditorDecorationType({
	isWholeLine: true,
	overviewRulerColor: 'blue',
	overviewRulerLane: vscode.OverviewRulerLane.Right,
	light: {
		// this color will be used in light color themes
		backgroundColor: `#E8625250`,
	},
	dark: {
		// this color will be used in dark color themes
		backgroundColor: `#E9190F50`,
	},
});

// create a decorator type that we use to decorate small numbers
const expander = vscode.window.createTextEditorDecorationType({
	borderWidth: '1px',
	borderStyle: 'dotted',
	overviewRulerColor: 'blue',
	overviewRulerLane: vscode.OverviewRulerLane.Right,
	light: {
		// this color will be used in light color themes
		borderColor: 'DarkGoldenRod',
	},
	dark: {
		// this color will be used in dark color themes
		borderColor: 'GoldenRod',
	},
});

const vertical_expander = vscode.window.createTextEditorDecorationType({
	borderWidth: '1px',
	borderStyle: 'dotted',
	//overviewRulerColor: 'blue',
	//overviewRulerLane: vscode.OverviewRulerLane.Right,
	light: {
		// this color will be used in light color themes
		borderColor: 'darkgreen',
	},
	dark: {
		// this color will be used in dark color themes
		borderColor: 'green',
	},
});

const LightOrange = vscode.window.createTextEditorDecorationType({
	borderWidth: '1px',
	borderStyle: 'solid',
	overviewRulerColor: 'red',
	overviewRulerLane: vscode.OverviewRulerLane.Right,
	light: {
		// this color will be used in light color themes
		borderColor: 'red',
	},
	dark: {
		// this color will be used in dark color themes
		borderColor: 'red',
	},
});

const LightBlue = vscode.window.createTextEditorDecorationType({
	borderWidth: '1px',
	borderStyle: 'dotted',
	overviewRulerColor: 'blue',
	overviewRulerLane: vscode.OverviewRulerLane.Right,
	light: {
		// this color will be used in light color themes
		borderColor: 'darkblue',
	},
	dark: {
		// this color will be used in dark color themes
		borderColor: 'lightblue',
	},
});

const BlueBoldForeground = vscode.window.createTextEditorDecorationType({
	light: {
		// this color will be used in light color themes
		//color: 'GoldenRod',
		fontWeight: 'bold',
		//backgroundColor: 'DarkSlateGray'
	},
	dark: {
		// this color will be used in dark color themes
		color: 'Chocolate',
		//backgroundColor: 'Black',
		//fontWeight: 'bold',
		//textDecoration: 'underline overline #FF3028',
		//borderColor: 'GoldenRod',
		//borderStyle: 'solid',
		//borderWidth: '0.1px'
	},
	/*
    after: {
        textDecoration: "underline overline #FF3028",
        contentText: "<--"
    }
    */
});

// const types: { [key in NL.DotNugg.DecorationType]: vscode.TextEditorDecorationType } = {
//     expander,
//     vertical_expander,
//     // LightOrange,
//     // LightBlue,
//     // RedLine,
//     // BlueBoldForeground,
//     // BookmarkGreen: undefined,
//     // BookmarkRed: undefined,
//     // ExternalCall: undefined,
// };

// export default { types };
