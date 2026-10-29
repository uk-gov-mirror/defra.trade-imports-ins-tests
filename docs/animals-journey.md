# Animals test flows and page objects

Why the animals flows and page objects are written the way they are. The code carries no comments, so the reasons live here. Sections without a file name are steps of `flows/animals/journey.ts`.

## Starting a notification

- `startNotification` answers origin and then opens the overview.
- `startNotificationAtOrigin` leaves origin unanswered. The entry guard is satisfied by the opening-run marker set when the notification is created, not by answering origin.
- `toOriginOfImport` shows origin unanswered, as a brand-new notification first shows it.
- `startNotification` waits for the origin page to leave before it opens the overview. Opening the overview regardless hides a failed save: the run then fails several steps later on a task stuck at "Not yet started", pointing at the wrong page.

## Reaching a page unfilled

- The `to*` steps land on a page without filling it, so a per-page spec can drive it.

## Dates

- `ARRIVAL_DATE` (in `domain/animals/constants/journey-options.ts`) falls inside the arrival-date window (one week back to six months ahead) wherever the wall clock is, written in the unpadded d/m/yyyy the application renders. A check-your-answers assertion then compares against the application's shape, not the typed string it echoes back.
- `TEMPORARY_ADMISSION_EXIT_DATE` falls after the arrival date, in the same format.

## Documents

- `uploadDocumentAndWaitForScan` waits for the virus scan to finish so the submission carries the document.
- `answerAccompanyingDocument` adds the answers' accompanying document using that wait, and does nothing when the answers carry none.

## Answer sets

- `submitNotification` gives only the answers the frontend requires (`MANDATORY_ANSWERS`), unless the caller passes a fuller set such as `ALL_ANSWERS`.
- The import reason's purpose is a conditional reveal under the reason, so both answers go in on one submit.

## Transport

- `reachTransporterFromHub` goes back to the transporter list from the hub within a journey that is already unlocked. The page saves through unfilled. Arrival details are filled on the way because the default means, Road, keeps transited countries in scope, and transit countries are answered next.
- `chooseTransporterType` adds a transporter of the given type from the transporter list.
- `toCommercialTransporter` follows the add route's commercial arm: the list first, then the transporter type question, then the form for a commercial transporter that is not on the list.
- `toTransporterSelection` reaches the approved commercial register by its own URL, because nothing links to it now that the commercial arm is the add-commercial form. It goes through that arm first so the transporter type is answered, which puts the commercial answer the register writes in scope.

## The overview task list

- `OPENING_RUN_TASKS` is the overview's task rows once a full opening run has answered everything, in the order the overview lists them.

## Addresses

- `addCphAndLeaveAddresses` runs from the addresses page: it answers the CPH number and then leaves the page.

## Notification view

### Cancelling an amendment (`flows/animals/notification-actions.ts`)

- `cancelAmend` waits on `?cancelled=1` rather than the view's heading, because the error page has the same heading.

### Party rows (`page-objects/animals/notification-view-page.ts`)

- `partyRow` selects the summary-list row whose accessible term is the role directly, rather than climbing to it, so no XPath parent-axis hop is needed.
- `editPartyDetails` is the row's own link to edit the address copied onto the notification. The card keeps the one Change link that re-picks from the address book.
- `partyError` reads the first definition of the row. A summary list has no error state of its own, so an outstanding role carries its message in the row's value cell, ahead of the actions cell.

## Choosing species (`page-objects/animals/commodity-selection-page.ts`)

- `searchAndCheckSpecies` searches for each species before ticking it, because a species has no tick box until its own search lists it, and ticks it inside the group for that commodity code.
