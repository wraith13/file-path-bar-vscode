import * as vscode from 'vscode';
import * as os from 'os';
import * as Config from "./lib/config";
import * as Locale from "./lib/locale";
const statusBarAlignmentObject = Object.freeze
({
    "none" : undefined,
    "left" : vscode.StatusBarAlignment.Left,
    "right" : vscode.StatusBarAlignment.Right,
});
export const statusBarAlignment = new Config.MapEntry ( "filePathBar.statusBarAlignment", statusBarAlignmentObject );
const pathStyleObject = Object.freeze
({
    "absolute" : (path: string) => path,
    "relative" : (path: string) => vscode.workspace.asRelativePath(path),
});
export const pathStyle = new Config.MapEntry ( "filePathBar.pathStyle", pathStyleObject );
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
        tooltip : Locale.map ( "filePathBar.menu.title" ),
    });
    export const update = ( ) : void =>
    {
        const document = vscode.window.activeTextEditor?.document;
        if ( hasActiveDocument ( ) && document )
        {
            pathLabel.text = `${ document.isDirty ? "$(primitive-dot)": "$(file)" } ${ pathStyle.get( "" )( document.fileName ) }`;
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
            vscode.workspace.onDidChangeConfiguration
            (
                async () =>
                {
                    pathStyle.clear();
                    await update();
                }
            ),
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
            const commands:
            {
                label: Locale.KeyType,
                command: string,
            }[] =
            [
                {
                    label: "darwin" === os.platform() ?
                        "File: Reval in Finder":
                        "File: Reval in File Explorer",
                    command: "revealFileInOS",
                },
                {
                    label: "File: Copy Path of Active File",
                    command: "copyFilePath",
                },
                {
                    label: "File: Copy Relative Path of Active File",
                    command: "copyRelativeFilePath",
                },
                {
                    label: "File: Compare Active File With...",
                    command: "workbench.files.action.compareFileWith",
                },
                {
                    label: "File: Compare Active File with Clipboard",
                    command: "workbench.files.action.compareWithClipboard",
                },
                {
                    label: "File: Compare Active File with Saved",
                    command: "workbench.files.action.compareWithSaved",
                },
                {
                    label: "File: Reval Active File in Side Bar",
                    command: "workbench.files.action.showActiveFileInExplorer",
                }
            ];
            await
            (
                await vscode.window.showQuickPick
                (
                    commands.map
                    (
                        i =>
                        ({
                            label: Locale.map ( i.label ),
                            detail: i.label === Locale.map ( i.label ) ? undefined: i.label,
                            action: async ( ) => await vscode.commands.executeCommand ( i.command, document.uri ),
                        })
                    ),
                    {
                        matchOnDetail: true,
                    }
                )
            )
            ?.action ( );
        }
    };
}
export const activate = FilePathBar.activate;
export const deactivate = FilePathBar.deactivate;
