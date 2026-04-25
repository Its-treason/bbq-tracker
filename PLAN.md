## Grill order tracker

I want a simple webapp to manage orders for our BBQ.
The App must be locally hosted and available via the web.
It must be very usable on the phone (Nothing phone 1)
Overall Design is not important, i'm the only one using it personally
Data i entered should be persited, it must be possible for others to optionally view what is available

## Tech stack

This is idea tech stack, you may change it

- NextJs for easy backend integration
- SQLite or simple JSON files as storage
- Frontend: mantine.dev + CSS modules

## Features

### Main feature: Managing orders

#### Setting up inventory

I want to edit the current inventory e.g. how many sousages, stackes etc are left
I must always be able to edit inventory.
I want to manually give each item a name + available count
This should also track how much inventory was already used.

#### Setting up participants

I want to be able to have a list of each participant so that i know who ordered what

#### Taking orders

This will be the main feature.
I want to be able to easly ask a participant what they want and assign it to them.
After "assigning" the order it should go to a "in progress" stage.

### In Progress

I want a seperate in progess screen with all order grouped by name.
From there i want to be able to cancel or complete a order.
I also want to be able to complete all orders at once.

