import blog from 'https://deno.land/x/blog/blog.tsx'

blog({
  author: 'Dallin',
  title: "Dallin's Blog",
  description: 'Gotta put these thoughts somewhere...',
  // avatar: 'avatar.png',
  // avatarClass: 'rounded-full',
  links: [
    { title: 'Email', url: 'mailto:dosmun+blog@gmail.com' },
    { title: 'GitHub', url: 'https://github.com/numso' },
    { title: 'Twitter', url: 'https://twitter.com/dallinosmun' }
  ]
})
