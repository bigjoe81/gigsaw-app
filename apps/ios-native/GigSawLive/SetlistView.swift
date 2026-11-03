import SwiftUI

struct SetlistView: View {
    let gig: Gig
    @Binding var role: String
    @State private var stageEntry: SetEntry?

    var body: some View {
        ZStack {
            LiveBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(gig.title).foregroundStyle(.secondary)
                    HStack {
                        Menu {
                            Picker("Il tuo ruolo", selection: $role) {
                                ForEach(MusicianRole.allCases) { item in Text(item.rawValue).tag(item.rawValue) }
                            }
                        } label: {
                            Label(role, systemImage: "pianokeys").font(.subheadline)
                                .padding(14).liveGlass()
                        }
                        Spacer()
                        DemoBadge()
                    }
                    ForEach(Array(gig.entries.enumerated()), id: \.element.id) { index, entry in
                        VStack(alignment: .leading, spacing: 10) {
                            Button { stageEntry = entry } label: {
                                HStack(spacing: 16) {
                                    Text(String(format: "%02d", index + 1)).monospacedDigit().foregroundStyle(.secondary)
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(entry.title).font(.headline).foregroundStyle(.white)
                                        if let song = entry.song {
                                            Text(song.key + (song.bpm.map { " · \($0) BPM" } ?? ""))
                                                .font(.caption).foregroundStyle(.secondary)
                                        } else {
                                            Text("Intermezzo").font(.caption).foregroundStyle(.secondary)
                                        }
                                    }
                                    Spacer()
                                    if entry.song?.needsSequence == true {
                                        Image(systemName: "waveform").foregroundStyle(LiveTheme.amber).accessibilityLabel("Richiede sequenza")
                                    }
                                    Text("\(entry.minutes) min").font(.caption).foregroundStyle(.secondary)
                                }
                                .padding(.vertical, 16).frame(maxWidth: .infinity, alignment: .leading)
                                .contentShape(Rectangle())
                            }.buttonStyle(.plain)
                            if entry.linkedToNext {
                                Label("Attacca il prossimo brano", systemImage: "link")
                                    .font(.caption).foregroundStyle(LiveTheme.amber)
                            }
                            Divider()
                        }
                    }
                    Text("Ruolo selezionato per la lettura. Nel demo gli accordi sono condivisi tra i ruoli; nessuna sequenza audio viene riprodotta.")
                        .font(.footnote).foregroundStyle(.secondary)
                }.padding(20)
            }
        }
        .navigationTitle("La scaletta")
        .safeAreaInset(edge: .bottom) {
            Button {
                stageEntry = gig.entries.first
            } label: { PrimaryAction(title: "Entra in Live", symbol: "arrow.up.right") }
            .buttonStyle(.plain).disabled(gig.entries.isEmpty).padding(20)
        }
        .fullScreenCover(item: $stageEntry) { entry in
            StageView(gig: gig, initialEntryID: entry.id, role: role)
        }
    }
}
