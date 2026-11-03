import SwiftUI

struct ProfileView: View {
    @Binding var role: String
    var body: some View {
        Form {
            Section("Il tuo ruolo") {
                Picker("Strumento", selection: $role) {
                    ForEach(MusicianRole.allCases) { item in Text(item.rawValue).tag(item.rawValue) }
                }
            }
            Section("GigSaw Live · Prototipo") {
                Label("Dati demo integrati", systemImage: "iphone")
                Text("Band, concerti e scalette sono esempi locali. Il collegamento al tuo account GigSaw e il download dei PDF per ruolo saranno aggiunti nella fase successiva.")
                    .foregroundStyle(.secondary)
                Text("Gli accordi sono illustrativi. Le icone delle sequenze indicano solo una nota di preparazione, senza riproduzione audio.")
                    .foregroundStyle(.secondary)
            }
        }.navigationTitle("Profilo")
    }
}
