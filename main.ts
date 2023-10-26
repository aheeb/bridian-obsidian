import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		this.addCommand({
			id: "export-current-note-as-json",
    name: "Export current note as JSON",
    editorCallback: (editor: Editor, view: MarkdownView) => {
        if (!view.file) {
            new Notice("Es gibt keine Datei, die exportiert werden kann.");
            return;
        }

        const noteContent = editor.getValue();

        // Verwendung des Non-Null Assertion-Operators hier
        const jsonData = {
            title: view.file!.basename,
            content: noteContent,
        };
		
				// Konvertieren Sie das Objekt in eine JSON-String-Repräsentation
				const jsonString = JSON.stringify(jsonData, null, 4); // Der dritte Parameter "4" sorgt für eine hübsche Formatierung
		
				// Benutzer fragen, ob er die Daten an den Endpunkt senden möchte
				const shouldSendToEndpoint = confirm('Möchten Sie die Daten direkt an den Endpunkt senden? Klicken Sie auf "Abbrechen", um die Daten nur herunterzuladen.');
		
				if (shouldSendToEndpoint) {
					fetch('http://localhost:5002/bridian-learning/europe-west6/default/api/v1/documents', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: jsonString,
					})
					.then(response => {
						if (!response.ok) {
							throw new Error(`Failed to send data for file: ${view.file!.basename}`);

						}
						return response.json();
					})
					.then(data => {
						new Notice('Daten erfolgreich gesendet!');
					})
					.catch(error => {
						new Notice(`Fehler beim Senden der Daten: ${error.message}`);
					});
				} else {
					const blob = new Blob([jsonString], {
						type: "application/json;charset=utf-8",
					});
					const a = document.createElement("a");
					a.href = URL.createObjectURL(blob);
					a.download = view.file.basename + ".json";
					a.click();
				}
			},
		});
		
		this.addCommand({
			id: "export-all-notes-as-json",
			name: "Export all notes as JSON",
			callback: async () => {
				// Liste aller Markdown-Dateien im Vault
				const markdownFiles = this.app.vault.getMarkdownFiles();

				const allNotes = [];

				for (let file of markdownFiles) {
					// Lese den Inhalt jeder Datei
					const content = await this.app.vault.read(file);

					// Füge den Inhalt und den Dateinamen zu allNotes hinzu
					allNotes.push({
						title: file.basename,
						content: content,
					});
				}

				// Konvertiere allNotes in eine JSON-String-Repräsentation
				const jsonString = JSON.stringify(allNotes, null, 4);

				// Bieten Sie die JSON-Datei zum Download an
				const blob = new Blob([jsonString], {
					type: "application/json;charset=utf-8",
				});
				const a = document.createElement("a");
				a.href = URL.createObjectURL(blob);
				a.download = "all-notes.json";
				a.click();
			},
		});

		function filterContent(content: any) {
			// Beispiel: Entfernen von Inhalten zwischen <!-- start-excalidraw --> und <!-- end-excalidraw -->
			content = content.replace(
				/<!-- start-excalidraw -->[\s\S]*?<!-- end-excalidraw -->/g,
				""
			);

			// Fügen Sie weitere reguläre Ausdrücke hinzu, um andere unerwünschte Inhalte zu entfernen...
			// ...

			return content;
		}
		this.addCommand({
    id: "export-all-notes-as-json-filtered",
    name: "Export all notes as JSON (filtered)",
    callback: async () => {
        const markdownFiles = this.app.vault.getMarkdownFiles();

        // Benutzer fragen, ob er die Daten an den Endpunkt senden möchte
        const shouldSendToEndpoint = confirm('Möchten Sie die Daten direkt an den Endpunkt senden? Klicken Sie auf "Abbrechen", um die Daten nur herunterzuladen.');

        if (shouldSendToEndpoint) {
            for (let file of markdownFiles) {
                const content = await this.app.vault.read(file);
                const filteredContent = filterContent(content);

                const dataToSend = {
                    title: file.basename,
                    content: filteredContent,
                };

                fetch('http://localhost:5002/bridian-learning/europe-west6/default/api/v1/documents', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSend),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to send data for file: ${file.basename}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(`Data successfully sent for file: ${file.basename}`);
                })
                .catch(error => {
                    console.error(error.message);
                });
            }

            new Notice('Daten senden abgeschlossen!');
        } else {
            const allNotes = [];

            for (let file of markdownFiles) {
                const content = await this.app.vault.read(file);
                const filteredContent = filterContent(content);

                allNotes.push({
                    title: file.basename,
                    content: filteredContent,
                });
            }

            const jsonString = JSON.stringify(allNotes, null, 4);
            const blob = new Blob([jsonString], {
                type: "application/json;charset=utf-8",
            });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "all-notes-filtered.json";
            a.click();
        }
    },
});

		

		this.addCommand({
    id: "export-all-notes-as-json-filtered",
    name: "Export all notes as JSON (filtered)",
    callback: async () => {
        const markdownFiles = this.app.vault.getMarkdownFiles();

        const allNotes = [];

        for (let file of markdownFiles) {
            const content = await this.app.vault.read(file);
            const filteredContent = filterContent(content);

            allNotes.push({
                title: file.basename,
                content: filteredContent,
            });
        }

        const jsonString = JSON.stringify(allNotes, null, 4);

        // Benutzer fragen, ob er die Daten an den Endpunkt senden möchte
        const shouldSendToEndpoint = confirm('Möchten Sie die Daten direkt an den Endpunkt senden? Klicken Sie auf "Abbrechen", um die Daten nur herunterzuladen.');

        if (shouldSendToEndpoint) {
            fetch('http://localhost:5002/bridian-learning/europe-west6/default/api/v1/documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: jsonString,
            })
            .then(response => response.json())
            .then(data => {
                new Notice('Daten erfolgreich gesendet!');
            })
            .catch(error => {
                new Notice('Fehler beim Senden der Daten: ' + error.message);
            });
        } else {
            const blob = new Blob([jsonString], {
                type: "application/json;charset=utf-8",
            });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "all-notes-filtered.json";
            a.click();
        }
    },
});


		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
