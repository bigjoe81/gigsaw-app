import SwiftUI

struct GigsView: View {
    let band: Band
    @Binding var role: String
    @State private var prepared: Set<String> = []

    var body: some View {
        ZStack {
            LiveBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Text(band.name).font(.subheadline).foregroundStyle(.secondary)
                    if band.gigs.isEmpty {
                        ContentUnavailableView("Nessun live in programma", systemImage: "calendar.badge.plus", description: Text("I concerti della tua band appariranno qui. Nel prototipo trovi il live dei Crossroads Blues Trio."))
                    }
                    ForEach(band.gigs) { gig in
                        VStack(alignment: .leading, spacing: 18) {
                            Image(systemName: "music.mic").font(.system(size: 54)).foregroundStyle(LiveTheme.amber).accessibilityHidden(true)
                            Text(gig.title).font(.title.bold())
                            Label(gig.date.formatted(date: .abbreviated, time: .shortened), systemImage: "calendar")
                            Label(gig.venue, systemImage: "mappin.and.ellipse")
                            DemoBadge()
                            Divider()
                            Label("\(gig.songs.count) brani · \(gig.durationMinutes) min", systemImage: "list.bullet")
                            NavigationLink {
                                SetlistView(gig: gig, role: $role)
                            } label: { PrimaryAction(title: "Apri scaletta") }
                            .buttonStyle(.plain)
                        }.liveCard()
                    }
                    if !band.gigs.isEmpty {
                        Text("Da preparare").font(.title3.bold())
                        ForEach(["Ripassa Straight to Jail", "Controlla le sequenze"], id: \.self) { task in
                            Button {
                                if prepared.contains(task) { prepared.remove(task) } else { prepared.insert(task) }
                            } label: {
                                Label(task, systemImage: prepared.contains(task) ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(prepared.contains(task) ? LiveTheme.amber : .white)
                                    .frame(maxWidth: .infinity, alignment: .leading).liveCard()
                            }
                            .buttonStyle(.plain)
                            .accessibilityValue(prepared.contains(task) ? "Completato" : "Da fare")
                        }
                    }
                }.padding(20)
            }
        }.navigationTitle("Prossimi live")
    }
}
