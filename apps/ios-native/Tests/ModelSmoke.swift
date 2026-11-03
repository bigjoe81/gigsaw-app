// Run after Models.swift in a single Swift script (see CI).
func expect(_ condition: @autoclosure () -> Bool, _ message: String) {
    precondition(condition(), message)
}
expect(Set(DemoData.bands.map(\.id)).count == DemoData.bands.count, "Band IDs must be unique")
expect(DemoData.bands[1].gigs.isEmpty, "Rockodiles demonstrates the empty state")
let gig = DemoData.halloween
expect(gig.songs.count == 4, "Interludes must not be counted as songs")
expect(gig.durationMinutes == 21, "Duration must include intro and pause")
expect(Set(gig.entries.map(\.id)).count == gig.entries.count, "Entries need unique IDs")
expect(gig.entries.first?.song == nil, "Stage mode starts with the spoken intro")
for (index, entry) in gig.entries.enumerated() where entry.linkedToNext {
    expect(index + 1 < gig.entries.count, "Linked entries need a successor")
    expect(entry.song != nil && gig.entries[index + 1].song != nil, "Linked entries must connect songs")
}
expect(DemoData.chicago.chords.count == 3 && DemoData.chicago.chords.allSatisfy { $0.count == 4 }, "Blues chart must have twelve bars")
var calendar = Calendar(identifier: .gregorian)
calendar.timeZone = TimeZone(identifier: "Europe/Rome")!
let date = calendar.dateComponents([.year, .month, .day, .hour], from: gig.date)
expect(date.year == 2026 && date.month == 10 && date.day == 31 && date.hour == 21, "Concert time must be 21:00 in Italy")
print("Model smoke checks passed")
