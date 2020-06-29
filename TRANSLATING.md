# Translating Arthur

First off, thank you for having an interest in translating Arthur into your language! Your time means a lot to me. You'll get a translator role in the Discord server and I'm open to other suggestions for rewards, within reason and within the scope of Arthur.

I have plans to make the translation process easier with a website, but I realize that it may be a while until that happens and I might as well have proper documentation of the current translation process. **Please read this whole document if you would like to translate Arthur.** It isn't too long (especially in comparison to the actual translation :eyes:), and I'd like to ensure that the translation process is as smooth as possible, both for you and me.

Thanks again!  
 \- Gymnophoria

## Setup

Please follow steps 1 and 2. I'll happily setup a file for you, though (meaning you can stop at step 2) - just ask! I'd say that the method from steps 3 onward is slightly more complicated if you don't know how JSON works, as you'll have to type in text as you go. You can alternatively copy the en-US file (see step 2) and then rename it as detailed in step 3.i and just change the authors/flag/translations to fit you (steps 4 and 5).

1. Get a good code editor. You could do this all in TextEdit or Notepad, but it'll be harder and more time consuming. I highly recommend [Visual Studio Code](https://code.visualstudio.com/Download), but any editor that supports JSON syntax highlighting and code indentation will do. A big plus if it'll catch JSON errors for you.

2. Open up Arthur's [en-US locale file](https://github.com/Gymnophoria/Arthur/blob/master/locales/en-US%20English%2C%20US.json) for reference. If you'd like to view it locally instead of in your browser, click the "Raw" button and then right click -> `Save as...`.

3. Make a JSON file for your language and open it in your editor.

    i. Name the file in the format `<locale code> <language name in English>.json`. For example, the US English file is named `en-US English, US.json`, with the locale code `en-US` and the language name `English, US`. Note that `US` was added on to the locale code and language name; if your translation is specific to a country, add that (in two letters) to the code and (in full) to the language name (e.g. `es-ES Español, España`, more examples of just the codes [here](https://www.ge.com/digital/documentation/predix-services/c_custom_locale_support.html)). Please use the [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) for your language (first column). The language/country should be in your language, not English. Ask me if you have any questions about this step (or any step!).
    
    ii. Copy and paste the following into the document:
```JSON
{
	"meta": {
		"authors": [
			"YOUR NAME HERE"
		],
		"flag": "SEE INSTRUCTIONS",
		"translations": {
		
		}
	}
}
```

4. Replace the `SEE INSTRUCTIONS` with the flag of the country your language is primarily spoken on. This is the flag displayed in Discord when listing languages; it's from a list of Discord emojis of countries. In Discord, go to the emoji picker, scroll to the very bottom, and find the name of your countries flag. Replace `SEE INSTRUCTIONS` with the part after the `flag_` (For example, the US is `:flag_us:`, so `us` is used).

5. Start translating! Replace `YOUR NAME HERE` with your name, however you want it to be displayed. Add any other names if you're collaborating. Start with translations of each language, by locale code, in the meta. All *values* need to be translated; that is, the parts after the colon (`:`).

## General Instructions

 - The above method of setting up means you'll have to retype or copy/paste in all the keys of the file. For example, starting with the `translations`, you'd have to type in the same `"cs": ` as in the en-US file, and then put your translation in quotes. The advantage to this is that anything you don't copy over will simply fall back to its English translation. However, if you know you are going to translate everything, or you would like to translate sections of the file at a time (e.g. a few commands at a time), it may be easier to copy and paste parts of the en-US file (or the whole thing) in, and then change the English translations into those of your language.

- Every value string should be translated. If you don't want to translate parts of the file, that's fine, but please don't leave the English translation in it.

- When filling out the `"meta"` section, keep the following in mind:
   - Please do override the English versions of commands. Arthur will try to find the command in your language, but will fall back to the English version if it can't.
   - Not all aliases need to be translated if they don't all make sense. You can also add more if it is logical, necessary, or a good play on words/joke (that still makes sense to be an alias). 
   - Please keep the square brackets (`[]`) and angle brackets (`<>`) in the `usage` section (but translate the text inside of them).

- Understand how Discord markdown works: `*asterisks*` make *italics*, `**double asterisks**` make **bold**, `***triple asterisks***` do ***both***, `__double underlines__` make <ins>underlined text</ins> and can be combined with any of the previous formatting. Please keep formatting where appropriate.
   - Also note that bots have access to masked links in certain scenarios, taking on the format `[text](link)`, where the `text` part becomes a clickable link. Please translate the `text`, but not the `link`.

- Arthur has variables within the text that start with `$` or `@@`. Please leave these as is and translate surrounding text.
   - For example, a string might say `"Page $page of $total pages."` You can rearrange the `$page` and `$total` variables in context (translating "Page", "of", and "pages", in a way that makes sense), but they must stay named `$page` and `$total` for Arthur to know where to insert those variables in the text. The same goes for variables that start with `@@`.

- When a response is an array (that is, it is surrounded by opening and closing square brackets, `[]`, and it has multiple strings in it), that means that there are multiple possible responses. Arthur will choose one of them randomly each time they're needed. Translate as many of these as you can, and feel free to add more if the meaning is still conveyed well.

- All developer commands need not have their meta translated, as they are only used by me. They start with `eval` and end with `stats`; you can simply not include any of them in the translation file.

- The "time" section towards the bottom of the file is used for formatting dates. If the country of your language formats dates/times in a different format (M/D/Y vs. D/M/Y, 24 hour time, etc.), feel free to change it around. See [the moment.js docs](https://momentjs.com/docs/#/displaying/) for all formatting types you can use.

- Try to maintain the sass of Arthur as best you can. Obviously if things can't be maintained in translation, though, it's fine. I guess. :)

## Tips and Tricks

 - Try to reference the en-US file that I had you open in the setup if you're confused about JSON syntax.
   - To see a working example translation, look at the [Dutch locale file](https://github.com/Gymnophoria/Arthur/blob/master/locales/nl%20Nederlands.json). It's no longer complete (as I've added many commands/translation features since it was completed), but it is still relevant.

- The en-US file is huge. Take your time, you can translate in steps. If you only feel like translating part of it, that's also fine; a partial translation is better than nothing, and I'll gladly add it to Arthur.

- Save often! I've already seen two people lose a fair bit of progress because of computer restarts/accidentally closing windows/etc. If your editor doesn't auto save, consider saving after every command or some other often interval to avoid this frustration.

- Please ask questions about anything if you're confused! Join the [support server](https://discord.gg/2SDdyF7) if you haven't already to ask questions, or if you prefer message me at Gymnophoria#8146.
 
 ## Finished translating?
 
 If you know how to use GitHub, feel free to submit a PR with your locale file added to the locales folder. Otherwise, send it to me over Discord and I'll add it to Arthur after confirming it works and looking it over. Thank you so much!
