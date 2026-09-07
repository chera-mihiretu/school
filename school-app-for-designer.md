# School platform — brief for web design

One product, many independent schools. Each school has its own address and public face. We (the operator) have a separate console to create and pause those schools.

Do not mix the two worlds in one layout.

---

## World 1 — Platform console

**Who:** platform admin only (not a principal, teacher, or parent).

**Where:** `admin.e-school.et` only. A school can never be named `admin`.

**They can:** sign in / out, create a school (name + subdomain slug), list schools, see status (`active` / `suspended`), suspend (site and logins stop; data kept), reactivate.

**They cannot:** run grades/attendance/classes, impersonate school users, edit a school’s public site, permanently delete a school.

**Screens:** sign-in · signed-in home · school list · create school · confirm suspend / reactivate · empty list · validation errors (reserved/invalid/duplicate slug, bad credentials).

Feeling: sparse, serious, operator-grade. High-stakes actions.

Example: name “North Hall”, slug `north-hall` → `north-hall.e-school.et`.

---

## World 2 — School public site

**Who:** visitors and families of *that* school.

**Where:** `{slug}.e-school.et` (same app, host decides the school). Apex `e-school.et` is the network pitch, not a campus.

**What it is:** generic public landing for starting schools: top nav (school monogram + our School lockup), the school’s name and address, about / staff sections, and a **Log in** button to `/login`. Custom site later.

**States to allow:** named campus · apex marketing · unknown slug (not a school) · suspended campus (unavailable, not a broken 404).

Feeling: warm, institutional. One template that can carry any school name.

---

## People

Platform admin belongs to the platform. Director, teacher, staff, student, and parent belong to one school only.

The school director, signed in on `{slug}.e-school.et`, creates that school's teachers. The platform operator cannot. Teachers sign in on the same campus `/login` (not `app.`).

Skip for now: gradebooks, attendance, parent portal, school CMS/themes, billing, inviting a director.

---

## One line

We host many schools. Each school gets its own address and public face. We get a locked-down console to create and pause those schools.
