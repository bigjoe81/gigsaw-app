import SwiftUI

struct BandsView: View {
    @Binding var selectedBandID: String
    let role: String
    let onSelect: () -> Void

    var body: some View {
        ZStack {
            LiveBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Ciao, Giorgio").foregroundStyle(.secondary)
                    ForEach(DemoData.bands) { band in
                        Button {
                            selectedBandID = band.id
                            onSelect()
                        } label: {
                            VStack(alignment: .leading, spacing: 24) {
                                HStack {
                                    Image(systemName: band.symbol).font(.system(size: 60))
                                        .foregroundStyle(LiveTheme.amber)
                                    Spacer()
                                    if selectedBandID == band.id {
                                        Image(systemName: "checkmark.circle.fill").foregroundStyle(LiveTheme.amber)
                                    }
                                }
                                HStack {
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(band.name).font(.title2.bold()).foregroundStyle(.white)
                                        Text(band.genre).font(.subheadline).foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right").foregroundStyle(LiveTheme.amber)
                                }
                            }
                            .padding(24).frame(maxWidth: .infinity, alignment: .leading)
                            .background(LinearGradient(colors: [LiveTheme.surface, .black], startPoint: .topLeading, endPoint: .bottomTrailing), in: RoundedRectangle(cornerRadius: 28))
                            .overlay(RoundedRectangle(cornerRadius: 28).strokeBorder(selectedBandID == band.id ? LiveTheme.amber : .white.opacity(0.15)))
                        }
                        .buttonStyle(.plain)
                        .accessibilityHint("Seleziona la band e mostra i suoi concerti")
                    }
                    Label {
                        VStack(alignment: .leading) {
                            Text("Il tuo ruolo").font(.caption).foregroundStyle(.secondary)
                            Text(role).font(.headline)
                        }
                    } icon: { Image(systemName: "pianokeys").font(.title2) }
                    .frame(maxWidth: .infinity, alignment: .leading).liveCard()
                    Text("Prototipo con dati demo. Nessun account richiesto.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                .padding(20)
            }
        }
        .navigationTitle("Le tue band")
    }
}
