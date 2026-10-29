# a11y

Accessibility tests for the INS frontend: the dashboard and the address book, each page scanned in its blank, filled and error states where it has them, plus the sign-in pages and the narrow-viewport views of the longer pages.

## Notes

- Not every reachable state is worth a dedicated scan — weigh the state's value against the test infrastructure it needs. Skip states that only exist behind disproportionate setup (e.g. seeding a real external queue to reach one rarely-used dialog).
- Not scanned: the empty dashboard and address book (they need an organisation with no data) and the address book's load-failure state.
