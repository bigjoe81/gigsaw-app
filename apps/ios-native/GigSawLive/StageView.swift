import SwiftUI
import UIKit

struct StageView: View {
    let gig: Gig
    let initialEntryID: String
    let role: String
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @AppStorage("stageFontSize") private var fontSize = 32.0
    @State private var index = 0
    @State private var previousIdleState = false

    private var entry: SetEntry? { gig.entries.indices.contains(index) ? gig.entries[index] : nil }
    private var nextTitle: String? { gig.entries.indices.contains(index + 1) ? gig.entries[index + 1].title : nil }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button("Chiudi", systemImage: "chevron.down") { dismiss() }
                    .labelStyle(.iconOnly).frame(minWidth: 44, minHeight: 44)
                Spacer()
                Text("\(index + 1) / \(gig.entries.count)").monospacedDigit()
                Spacer()
                Text("Demo").font(.caption).foregroundStyle(.secondary)
            }.padding(12).liveGlass().padding(.horizontal, 16)
            ScrollView {
                VStack(alignment: .leading, spacing: 32) {
                    Text(entry?.title ?? "Scaletta vuota").font(.largeTitle.bold())
                    Text(role + (entry?.song.map { " · \($0.key)" } ?? "")).foregroundStyle(.secondary)
                    if let song = entry?.song {
                        if song.chords.isEmpty {
                            ContentUnavailableView("Accordi da aggiungere", systemImage: "music.note.list")
                        } else {
                            ForEach(Array(song.chords.enumerated()), id: \.offset) { _, row in
                                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 4), spacing: 20) {
                                    ForEach(Array(row.enumerated()), id: \.offset) { _, chord in
                                        Text(chord).font(.system(size: fontSize, weight: .bold, design: .rounded))
                                            .foregroundStyle(LiveTheme.amber).minimumScaleFactor(0.5).lineLimit(1)
                                            .frame(maxWidth: .infinity, minHeight: 60)
                                    }
                                }
                            }
                        }
                        Divider()
                        Text("Note").font(.headline).foregroundStyle(.secondary)
                        Text(song.notes).font(.system(size: max(20, fontSize * 0.65)))
                    } else {
                        Label(entry?.title == "Intro" ? "Presentazione della band" : "Prenditi il tempo per parlare al pubblico", systemImage: "mic")
                            .font(.title2)
                        Text("Quando siete pronti, passa al prossimo brano.").foregroundStyle(.secondary)
                    }
                }.frame(maxWidth: 800, alignment: .leading).padding(24).frame(maxWidth: .infinity)
            }
            VStack(spacing: 12) {
                Text(nextTitle.map { "Prossimo · \($0)" } ?? "Fine della scaletta").font(.subheadline).lineLimit(2)
                HStack(spacing: 20) {
                    Button { index -= 1 } label: { Image(systemName: "chevron.left").frame(minWidth: 44, minHeight: 44) }
                        .disabled(index == 0).accessibilityLabel("Elemento precedente")
                    Button { fontSize = max(24, fontSize - 4) } label: { Text("A−").frame(minWidth: 44, minHeight: 44) }
                        .accessibilityLabel("Riduci testo")
                    Button { fontSize = min(60, fontSize + 4) } label: { Text("A+").frame(minWidth: 44, minHeight: 44) }
                        .accessibilityLabel("Ingrandisci testo")
                    Button { index += 1 } label: { Image(systemName: "chevron.right").frame(minWidth: 44, minHeight: 44) }
                        .disabled(nextTitle == nil).accessibilityLabel("Elemento successivo")
                }.font(.title2).buttonStyle(.plain)
            }.padding(16).liveGlass().padding(16)
        }
        .background(Color.black.ignoresSafeArea()).preferredColorScheme(.dark)
        .onAppear {
            index = gig.entries.firstIndex { $0.id == initialEntryID } ?? 0
            previousIdleState = UIApplication.shared.isIdleTimerDisabled
            UIApplication.shared.isIdleTimerDisabled = true
        }
        .onChange(of: scenePhase) { _, phase in
            UIApplication.shared.isIdleTimerDisabled = phase == .active ? true : previousIdleState
        }
        .onDisappear { UIApplication.shared.isIdleTimerDisabled = previousIdleState }
    }
}
