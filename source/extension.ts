import * as vscode from 'vscode';
import * as os from 'os';
import * as vscel from '@wraith13/vscel';
import packageJson from "../package.json";
import localeEn from "../package.nls.json";
import localeJa from "../package.nls.ja.json";
export type LocaleKeyType = keyof typeof localeEn;
const locale = vscel.locale.make(localeEn, { "ja": localeJa });
const configRoot = vscel.config.makeRoot(packageJson);
const statusBarAlignmentObject = Object.freeze
({
    "none": undefined,
    "left": vscode.StatusBarAlignment.Left,
    "right": vscode.StatusBarAlignment.Right,
});
export const statusBarAlignment = configRoot.makeMapEntry("filePathBar.statusBarAlignment", "root-workspace", statusBarAlignmentObject);
const pathStyleObject = Object.freeze
({
    "absolute": (path: string) => path,
    "relative": (path: string) => vscode.workspace.asRelativePath(path),
});
export const pathStyle = configRoot.makeMapEntry ("filePathBar.pathStyle", "root-workspace", pathStyleObject);
const hasActiveDocument = () => undefined !== vscode.window.activeTextEditor && undefined !== vscode.window.activeTextEditor.viewColumn;
module StatusBarItem
{
    let pathLabel: vscode.StatusBarItem;
    export const make = () => pathLabel = vscel.statusbar.createItem
    ({
        alignment: statusBarAlignment.get("default-scope"),
        text: `$(file) dummy`,
        command: `filePathBar.menu`,
        tooltip: locale.map ( "filePathBar.menu.title" ),
    });
    export const update = (): void =>
    {
        const document = vscode.window.activeTextEditor?.document;
        if (hasActiveDocument() && document)
        {
            pathLabel.text = `${document.isDirty ? "$(primitive-dot)": "$(file)"} ${pathStyle.get("default-scope")(document.fileName)}`;
            pathLabel.show();
        }
        else
        {
            pathLabel.hide();
        }
    };
}
module FilePathBar
{
    export const activate = (context: vscode.ExtensionContext) =>
    {
        context.subscriptions.push
        (
            StatusBarItem.make(),
            vscode.commands.registerCommand(`filePathBar.menu`, menu),
            vscode.workspace.onDidChangeConfiguration
            (
                async () =>
                {
                    //pathStyle.clear();
                    await update();
                }
            ),
            vscode.window.onDidChangeActiveTextEditor(update),
            vscode.workspace.onDidChangeTextDocument(update),
            vscode.workspace.onDidSaveTextDocument(update),
        );
        update ( );
    };
    export const deactivate = () =>
    {
    };
    export const update = async () =>
    {
        await vscode.commands.executeCommand
        (
            'setContext',
            'existsActiveTextDocument',
            hasActiveDocument()
        );
        StatusBarItem.update();
    };
    export const menu = async () =>
    {
        const document = vscode.window.activeTextEditor?.document;
        if (hasActiveDocument() && document)
        {
            const commands:
            {
                label: LocaleKeyType,
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
                            label: locale.map(i.label),
                            detail: i.label === locale.map(i.label) ? undefined: i.label,
                            action: async () => await vscode.commands.executeCommand(i.command, document.uri),
                        })
                    ),
                    {
                        matchOnDetail: true,
                    }
                )
            )
            ?.action();
        }
    };
}
export const activate = FilePathBar.activate;
export const deactivate = FilePathBar.deactivate;
