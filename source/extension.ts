import * as vscode from 'vscode';
import * as Config from "./lib/config";
import * as Locale from "./lib/locale";
const extractDirectory = ( path : string ) : string => path.replace ( /^(.*[\\//])([^\\//]+)$/, "$1" );
const statusBarAlignmentObject = Object.freeze
({
    "none" : undefined,
    "left" : vscode.StatusBarAlignment.Left,
    "right" : vscode.StatusBarAlignment.Right,
});
export const statusBarAlignment = new Config.MapEntry ( "filePathBar.statusBarAlignment", statusBarAlignmentObject );
const hasActiveDocument = ( ) => undefined !== vscode.window.activeTextEditor && undefined !== vscode.window.activeTextEditor.viewColumn;
module StatusBarItem
{
    const create =
    (
        properties :
        {
            alignment ? : vscode.StatusBarAlignment,
            text ? : string,
            command ? : string,
            tooltip ? : string
        }
    )
    : vscode.StatusBarItem =>
    {
        const result = vscode.window.createStatusBarItem ( properties.alignment );
        if ( undefined !== properties.text )
        {
            result.text = properties.text;
        }
        if ( undefined !== properties.command )
        {
            result.command = properties.command;
        }
        if ( undefined !== properties.tooltip )
        {
            result.tooltip = properties.tooltip;
        }
        return result;
    };
    let pathLabel: vscode.StatusBarItem;
    export const make = ( ) => pathLabel = create
    ({
        alignment : statusBarAlignment.get( "" ),
        text : `$(file) dummy`,
        command : `filePathBar.menu`,
        tooltip : `Copy...`,
    });
    export const update = ( ) : void =>
    {
        const document = vscode.window.activeTextEditor?.document;
        if ( hasActiveDocument ( ) && document )
        {
            pathLabel.text = `${ document.isDirty ? "$(primitive-dot)": "$(file)" } ${ document.fileName }`;
            pathLabel.show ( );
        }
        else
        {
            pathLabel.hide ( );
        }
    };
}
module FilePathBar
{
    export const activate = ( context: vscode.ExtensionContext ) =>
    {
        context.subscriptions.push
        (
            StatusBarItem.make ( ),
            vscode.commands.registerCommand ( `filePathBar.menu`, menu ),
            vscode.window.onDidChangeActiveTextEditor ( update ),
            vscode.workspace.onDidChangeTextDocument ( update ),
            vscode.workspace.onDidSaveTextDocument ( update ),
        );
        update ( );
    };
    export const deactivate = ( ) =>
    {
    };
    export const update = async ( ) =>
    {
        await vscode.commands.executeCommand
        (
            'setContext',
            'existsActiveTextDocument',
            hasActiveDocument ( )
        );
        StatusBarItem.update ( );
    };
    export const menu = async ( ) =>
    {
        const document = vscode.window.activeTextEditor?.document;
        if ( hasActiveDocument ( ) && document )
        {
            await
            (
                await vscode.window.showQuickPick
                ([
                    {
                        label: `$(clippy) ${ Locale.map ( "Copy File Path" ) }`,
                        detail: document.fileName,
                        action: async ( ) => await vscode.env.clipboard.writeText ( document.fileName ),
                    },
                    {
                        label: `$(folder-opened) ${ Locale.map ( "Show Folder" ) }`,
                        detail: extractDirectory ( document.fileName ),
                        action: async ( ) => vscode.env.openExternal
                        (
                            vscode.Uri.parse
                            (
                                extractDirectory
                                (
                                    document.uri.toString ( )
                                )
                            )
                        ),
                    },
                ])
            )
            ?.action ( );
        }
    };
}
export const activate = FilePathBar.activate;
export const deactivate = FilePathBar.deactivate;
