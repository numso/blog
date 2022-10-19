---
title: Global .gitignore
publish_date: 2022-10-19
---

# Setting up a global .gitignore file

I've found I often need to write a one-off script, take some notes, or store some code related to a project I'm in. I don't want to accidentally commit that stuff to the project. So I created a .gitignore file that gets applied to all of my git projects that ignores `.dallin`. Now I can create a `.dallin/` folder and add whatever I want without worrying about accidentally committing!

It's fairly simple. I created this `~/.gitignore` in my home directory:

```gitignore
.dallin

# elixir ignores files/directories that start with a dot
git-ignored-dallin
```

And then in your `~/.gitconfig` you need to add the following:

```.gitconfig
[core]
	excludesFile = ~/.gitignore
```

Happy coding!
