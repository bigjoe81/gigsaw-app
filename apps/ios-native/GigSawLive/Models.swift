import Foundation

struct Band: Identifiable, Hashable {
    let id: String
    let name: String
    let genre: String
    let symbol: String
    let gigs: [Gig]
}

struct Gig: Identifiable, Hashable {
    let id: String
    let title: String
    let venue: String
    let date: Date
    let entries: [SetEntry]

    var songs: [Song] { entries.compactMap(\.song) }
    var durationMinutes: Int { entries.reduce(0) { $0 + $1.minutes } }
}

struct Song: Identifiable, Hashable {
    let id: String
    let title: String
    let key: String
    let bpm: Int?
    let chords: [[String]]
    let notes: String
    let needsSequence: Bool
}

struct SetEntry: Identifiable, Hashable {
    let id: String
    let title: String
    let song: Song?
    let minutes: Int
    let linkedToNext: Bool
}

enum MusicianRole: String, CaseIterable, Identifiable {
    case piano = "Piano / Armonica"
    case guitar = "Chitarra"
    case voice = "Voce"
    var id: String { rawValue }
}

// Bundled fixtures: all screens work in airplane mode. These are not synced API records.
enum DemoData {
    static let chicago = Song(id: "chicago", title: "Sweet Home Chicago", key: "E", bpm: 102,
        chords: [["E7", "A7", "E7", "E7"], ["A7", "A7", "E7", "E7"], ["B7", "A7", "E7", "B7"]],
        notes: "Intro: 4 battute\nSolo armonica dopo la seconda strofa", needsSequence: true)
    static let jail = Song(id: "jail", title: "Straight to Jail", key: "G", bpm: nil,
        chords: [["G7", "C7", "G7", "G7"], ["C7", "C7", "G7", "G7"], ["D7", "C7", "G7", "D7"]],
        notes: "Controlla l’attacco dopo la pausa parlata.", needsSequence: true)
    static let harvey = Song(id: "harvey", title: "Blue Harvey", key: "—", bpm: nil,
        chords: [], notes: "Attacca Fishes senza pausa.\nAccordi da aggiungere.", needsSequence: true)
    static let fishes = Song(id: "fishes", title: "Fishes in the Toilet Seat", key: "—", bpm: nil,
        chords: [], notes: "Brano collegato a Blue Harvey.\nAccordi da aggiungere.", needsSequence: true)
    static let entries: [SetEntry] = [
        .init(id: "intro", title: "Intro", song: nil, minutes: 1, linkedToNext: false),
        .init(id: "chicago", title: chicago.title, song: chicago, minutes: 5, linkedToNext: false),
        .init(id: "pause", title: "Pausa parlata", song: nil, minutes: 1, linkedToNext: false),
        .init(id: "jail", title: jail.title, song: jail, minutes: 5, linkedToNext: false),
        .init(id: "harvey", title: harvey.title, song: harvey, minutes: 4, linkedToNext: true),
        .init(id: "fishes", title: fishes.title, song: fishes, minutes: 5, linkedToNext: false)
    ]
    static let halloween = Gig(id: "halloween", title: "Halloween Live", venue: "Nama Brewing",
        date: Date(timeIntervalSince1970: 1793476800), entries: entries)
    static let bands: [Band] = [
        .init(id: "cbt", name: "Crossroads Blues Trio", genre: "Blues · Rock ’n’ roll", symbol: "pianokeys", gigs: [halloween]),
        .init(id: "rockodiles", name: "The Rockodiles", genre: "Rock ’n’ roll anni ’50", symbol: "guitars", gigs: [])
    ]
}
