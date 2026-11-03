import SwiftUI

@main
struct GigSawLiveApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .tint(LiveTheme.amber)
                .preferredColorScheme(.dark)
                .environment(\.locale, Locale(identifier: "it_IT"))
        }
    }
}

struct RootView: View {
    @AppStorage("selectedBandID") private var selectedBandID = "cbt"
    @AppStorage("musicianRole") private var role = MusicianRole.piano.rawValue
    @State private var selectedTab = 0

    private var selectedBand: Band {
        DemoData.bands.first { $0.id == selectedBandID } ?? DemoData.bands[0]
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                BandsView(selectedBandID: $selectedBandID, role: role) {
                    selectedTab = 1
                }
            }
            .tabItem { Label("Band", systemImage: "person.3.fill") }.tag(0)
            NavigationStack {
                GigsView(band: selectedBand, role: $role)
            }
            .id(selectedBand.id)
            .tabItem { Label("Live", systemImage: "calendar") }.tag(1)
            NavigationStack {
                ProfileView(role: $role)
            }
            .tabItem { Label("Profilo", systemImage: "person.crop.circle") }.tag(2)
        }
    }
}

#Preview { RootView().preferredColorScheme(.dark).tint(LiveTheme.amber) }
