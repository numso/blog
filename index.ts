import blog from 'https://deno.land/x/blog@0.4.1/blog.tsx'

blog({
  title: "Dallin's Blog",
  description: 'Gotta put these thoughts somewhere...',
  avatar: 'https://deno-avatar.deno.dev/avatar/blog.svg',
  avatarClass: 'rounded-full',
  author: 'Dallin',
  links: [
    { title: 'Email', url: 'mailto:dosmun+blog@gmail.com' },
    { title: 'GitHub', url: 'https://github.com/numso' },
    { title: 'Twitter', url: 'https://twitter.com/dallinosmun' }
  ]
  // middlewares: [

  // If you want to set up Google Analytics, paste your GA key here.
  // ga("UA-XXXXXXXX-X"),

  // If you want to provide some redirections, you can specify them here,
  // pathname specified in a key will redirect to pathname in the value.
  // redirects({
  //  "/hello_world.html": "/hello_world",
  // }),

  // ]
})
