# BPMN Diff and Merge Tool

A visual Git diff and merge tool for BPMN files, powered by bpmn.io.

## Setup

Add these to your Git configuration:

```
[difftool "bpmndiff"]
  cmd = npx bpmndiff $LOCAL $REMOTE

[mergetool "bpmnmerge"]
  cmd = npx bpmnmerge $BASE $LOCAL $REMOTE $MERGED
  trustExitCode = true
```

## Usage

### Diff

Run a visual diff on BPMN files:

```sh
git difftool -t bpmndiff HEAD~1 HEAD diagram.bpmn
```

### Merge

Resolve BPMN merge conflicts visually:

```sh
git mergetool -t bpmnmerge diagram.bpmn
```

## License

MIT