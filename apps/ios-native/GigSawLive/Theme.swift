import SwiftUI

enum LiveTheme {
    static let amber = Color(red: 1, green: 0.73, blue: 0.32)
    static let background = Color(red: 0.035, green: 0.045, blue: 0.055)
    static let surface = Color(red: 0.09, green: 0.11, blue: 0.13)
}

struct LiveBackground: View {
    var body: some View {
        LinearGradient(colors: [LiveTheme.surface, LiveTheme.background, .black],
                       startPoint: .topLeading, endPoint: .bottomTrailing)
            .ignoresSafeArea()
    }
}

struct GlassSurface: ViewModifier {
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    var accent = false

    @ViewBuilder func body(content: Content) -> some View {
        if reduceTransparency {
            content.background(accent ? Color(red: 0.32, green: 0.18, blue: 0.035) : LiveTheme.surface, in: Capsule())
        } else if #available(iOS 26.0, *) {
            content.glassEffect(.regular.tint(accent ? LiveTheme.amber.opacity(0.5) : .clear), in: Capsule())
        } else {
            content.background(.ultraThinMaterial, in: Capsule())
                .overlay(Capsule().strokeBorder(accent ? LiveTheme.amber : .white.opacity(0.18)))
        }
    }
}

extension View {
    func liveGlass(accent: Bool = false) -> some View { modifier(GlassSurface(accent: accent)) }
    func liveCard() -> some View {
        padding(20).background(LiveTheme.surface, in: RoundedRectangle(cornerRadius: 24))
    }
}

struct DemoBadge: View {
    var body: some View {
        Label("Demo locale", systemImage: "checkmark.circle.fill")
            .font(.caption.weight(.medium)).foregroundStyle(.green)
            .padding(.horizontal, 12).padding(.vertical, 8).liveGlass()
            .accessibilityLabel("Dati demo integrati, disponibili senza rete")
    }
}

struct PrimaryAction: View {
    let title: String
    var symbol = "arrow.right"
    var body: some View {
        HStack { Text(title); Spacer(); Image(systemName: symbol) }
            .font(.headline).foregroundStyle(.white)
            .padding(20).liveGlass(accent: true)
            .contentShape(Capsule())
    }
}
