"use strict";

var /** @const */
  MIN_BUFFER_SIZE = 0x100,
  /**
   * A
   * @const
   */
  MAX_BUFFER_SIZE = 0x1000000,
  /**
   * An estimated guess for the density of a Life pattern, in alive/cell
   * @const
   */
  DENSITY_ESTIMATE = 0.009;

export function parse_rle(pattern_string) {
  var result = parse_comments(pattern_string, "#"),
    x = 0,
    y = 0,
    header_match,
    expr = /([a-zA-Z]+) *= *([a-zA-Z0-9\/()]+)/g,
    match;

  pattern_string = result.pattern_string;
  var pos = pattern_string.indexOf("\n");

  if (pos === -1) {
    return { error: "RLE Syntax Error: No Header" };
  }

  while ((header_match = expr.exec(pattern_string.substr(0, pos)))) {
    switch (header_match[1]) {
      case "x":
        result.width = Number(header_match[2]);
        break;

      case "y":
        result.height = Number(header_match[2]);
        break;

      case "rule":
        result.rule_s = parse_rule_rle(header_match[2], true);
        result.rule_b = parse_rule_rle(header_match[2], false);

        result.comment +=
          "\nRule: " + rule2str(result.rule_s, result.rule_b) + "\n";
        result.rule = rule2str(result.rule_s, result.rule_b);
        break;

      case "alpha":
      case "color":
        break;

      default:
        //console.log(header_match);
        return {
          error: "RLE Syntax Error: Invalid Header: " + header_match[1],
        };
    }
  }
  /*
           Today I learned:

           Optimize a certain string parsing algorithm (1 Megabyte input).
           Timings:
           1. using while(str = str.replace(re, callback)): Over 9000
           2. using while(match = re.exec(str)): 800ms
           3. using for(var pos = 0; pos < str.length; pos++) chr = str[pos]: 750ms
           4. using for(var pos = 0; pos < str.length; pos++) chr = str.charCodeAt(pos): 50ms

           => re.exec is way faster than str.replace (obviously)
           => parsing character by character with str comparisons is same speed as re.exec
           => number comparisons are way faster than single character comparisons
        */
  //console.time("parse rle");

  var initial_size = MIN_BUFFER_SIZE;

  if (result.width && result.height) {
    var size = result.width * result.height;

    if (size > 0) {
      initial_size = Math.max(initial_size, (size * DENSITY_ESTIMATE) | 0);
      initial_size = Math.min(MAX_BUFFER_SIZE, initial_size);
    }
  }

  var count = 1,
    in_number = false,
    chr,
    field_x = new Int32Array(initial_size),
    field_y = new Int32Array(initial_size),
    alive_count = 0,
    len = pattern_string.length;

  for (; pos < len; pos++) {
    chr = pattern_string.charCodeAt(pos);

    if (chr >= 48 && chr <= 57) {
      if (in_number) {
        count *= 10;
        count += chr ^ 48;
      } else {
        count = chr ^ 48;
        in_number = true;
      }
    } else {
      if (chr === 98) {
        // b
        x += count;
      } else if ((chr >= 65 && chr <= 90) || (chr >= 97 && chr < 122)) {
        // A-Za-z
        if (alive_count + count > field_x.length) {
          field_x = increase_buf_size(field_x);
          field_y = increase_buf_size(field_y);
        }

        while (count--) {
          field_x[alive_count] = x++;
          field_y[alive_count] = y;
          alive_count++;
        }
      } else if (chr === 36) {
        // $
        y += count;
        x = 0;
      } else if (chr === 33) {
        // !
        break;
      }

      count = 1;
      in_number = false;
    }
  }
  //console.timeEnd("parse rle");
  //console.log(initial_size, alive_count);

  result.field_x = new Int32Array(field_x.buffer, 0, alive_count);
  result.field_y = new Int32Array(field_y.buffer, 0, alive_count);

  return result;
}

function increase_buf_size(buffer) {
  var new_buffer = new Int32Array((buffer.length * 1.5) | 0);
  new_buffer.set(buffer);
  return new_buffer;
}

function parse_comments(pattern_string, comment_char) {
  var result = {
      comment: "",
      urls: [],
      short_comment: "",
    },
    nl,
    line,
    cont,
    advanced = comment_char === "#";

  while (pattern_string[0] === comment_char) {
    nl = pattern_string.indexOf("\n");
    line = pattern_string.substr(1, nl - 1);
    cont = true;

    if (advanced) {
      line = line.substr(1).trim();

      switch (pattern_string[1]) {
        case "N":
          if (line) {
            result.title = line;
          } else {
            result.rule = "23/3";
          }
          cont = false;
          break;

        case "C":
        case "D":
          if (!result.short_comment) {
            result.short_comment = line;
          }
          break;

        case "O":
          result.author = line;
          break;

        case "R":
          result.rule = line;
          cont = false;
          break;

        //case "P":
        // center of the pattern
        //    cont = false;
        //    break;

        default:
          cont = false;
      }
    }

    if (cont) {
      if (/^(?:https?:\/\/|www\.)[a-z0-9]/i.test(line)) {
        if (line.substr(0, 4) !== "http") {
          line = "http://" + line;
        }

        result.urls.push(line);
      } else if (line.substr(0, 5) === "Name:") {
        result.title = line.substr(5);
      } else {
        result.comment += line;

        if (nl !== 70 && nl !== 80) {
          result.comment += "\n";
        }
      }
    }

    pattern_string = pattern_string.substr(nl + 1);
  }

  result.pattern_string = pattern_string;
  result.comment = result.comment.trim();

  return result;
}

function rule2str(rule_s, rule_b) {
  var rule = "";

  for (var i = 0; rule_s; rule_s >>= 1, i++) {
    if (rule_s & 1) {
      rule += i;
    }
  }

  rule += "/";

  for (var i = 0; rule_b; rule_b >>= 1, i++) {
    if (rule_b & 1) {
      rule += i;
    }
  }

  return rule;
}

function parse_rule_rle(rule_str, survived) {
  rule_str = rule_str.split("/");

  if (!rule_str[1]) {
    return false;
  }

  if (Number(rule_str[0])) {
    return parse_rule(rule_str.join("/"), survived);
  }

  if (rule_str[0][0].toLowerCase() === "b") {
    rule_str.reverse();
  }

  return parse_rule(
    rule_str[0].substr(1) + "/" + rule_str[1].substr(1),
    survived
  );
}

function parse_rule(rule_str, survived) {
  var rule = 0,
    parsed = rule_str.split("/")[survived ? 0 : 1];

  for (var i = 0; i < parsed.length; i++) {
    var n = Number(parsed[i]);

    if (isNaN(n) || rule & (1 << n)) {
      return false;
    }

    rule |= 1 << n;
  }

  return rule;
}
