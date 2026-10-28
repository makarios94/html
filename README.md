# html

## AssetLink newsletter agent

`.claude/agents/assetlink-newsletter-writer.md` is a Claude Code subagent that writes, outlines and edits issues of **The Asset Link**, AssetLink's LinkedIn newsletter.

It is built from AssetLink's current strategy documents (Positioning & Messaging, Content Strategy, Content Plan, Content Calendar, Website Copy review, Product & Market Research). It knows:

- **The arc:** hook opening → the meat (problem, cause, cost, what good looks like) → climax (the reframe line plus a single AssetLink bridge) → close (bookend plus one clear CTA)
- **The messaging:** "Know who, why and when", the one-liner, the lead line for each buyer, approved proof
- **The rules:** banned phrases, features that aren't live yet, no advisor, customer or competitor names, no secret sauce, no invented numbers

### Use it

In Claude Code, from this repo:

```
Use the assetlink-newsletter-writer agent to write an issue on "Your tool already sends alerts. Why isn't that enough?" for recruiting leaders.
```

Each issue comes back with 3 headline options, a subtitle, a cover image brief, the full issue, a LinkedIn share post, an SEO title and description, and editor notes (placeholders, claims needing approval, rubric scores).

To use it outside Claude Code (in a Claude Project or another tool), paste everything below the `---` front matter as the system prompt.
