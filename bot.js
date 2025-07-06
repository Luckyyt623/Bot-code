// Combined Slither.io Bot Script with Updated Canvas, Bot, and UserInterface
(function(window, document) {
  // === Canvas Module ===
  var canvas = window.canvas = {
    setMouseCoordinates: function(point) {
      window.xm = point.x;
      window.ym = point.y;
    },

mapToMouse: function(point) {
      var mouseX = (point.x - window.snake.xx) * window.gsc;
      var mouseY = (point.y - window.snake.yy) * window.gsc;
      return { x: mouseX, y: mouseY };
    },


    mapToCanvas: function(point) {
      var c = {
        x: window.mww2 + (point.x - window.view_xx) * window.gsc,
        y: window.mhh2 + (point.y - window.view_yy) * window.gsc
      };
      return c;
    },

    circleMapToCanvas: function(circle) {
      var newCircle = canvas.mapToCanvas({ x: circle.x, y: circle.y });
      return canvas.circle(newCircle.x, newCircle.y, circle.radius * window.gsc);
    },

    point: function(x, y) {
      return { x: Math.round(x), y: Math.round(y) };
    },

    rect: function(x, y, w, h) {
      return {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(w),
        height: Math.round(h)
      };
    },

    circle: function(x, y, r) {
      return { x: Math.round(x), y: Math.round(y), radius: Math.round(r) };
    },

    fastAtan2: function(y, x) {
      const QPI = Math.PI / 4;
      const TQPI = 3 * Math.PI / 4;
      var r = 0.0;
      var angle = 0.0;
      var abs_y = Math.abs(y) + 1e-10;
      if (x < 0) {
        r = (x + abs_y) / (abs_y - x);
        angle = TQPI;
      } else {
        r = (x - abs_y) / (x + abs_y);
        angle = QPI;
      }
      angle += (0.1963 * r * r - 0.9817) * r;
      return y < 0 ? -angle : angle;
    },

    setZoom: function(e) {
      if (window.gsc) {
        window.gsc *= Math.pow(0.9, e.wheelDelta / -120 || e.detail / 2 || 0);
        window.desired_gsc = window.gsc;
      }
    },

    resetZoom: function() {
      window.gsc = 0.9;
      window.desired_gsc = 0.9;
    },

    maintainZoom: function() {
      if (window.desired_gsc !== undefined) {
        window.gsc = window.desired_gsc;
      }
    },

    setBackground: function(url) {
      url = typeof url !== 'undefined' ? url : '/s/bg45.jpg';
      window.ii.src = url;
    },

    drawRect: function(rect, color, fill, alpha) {
      if (alpha === undefined) alpha = 1;
      var context = window.mc?.getContext('2d');
      if (!context) return;
      var lc = canvas.mapToCanvas({ x: rect.x, y: rect.y });
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = color;
      context.rect(lc.x, lc.y, rect.width * window.gsc, rect.height * window.gsc);
      context.stroke();
      if (fill) {
        context.fillStyle = color;
        context.fill();
      }
      context.restore();
    },

    drawCircle: function(circle, color, fill, alpha) {
      if (alpha === undefined) alpha = 1;
      if (circle.radius === undefined) circle.radius = 5;
      var context = window.mc?.getContext('2d');
      if (!context) return;
      var drawCircle = canvas.circleMapToCanvas(circle);
      context.save();
      context.globalAlpha = alpha;
      context.beginPath();
      context.strokeStyle = color;
      context.arc(drawCircle.x, drawCircle.y, drawCircle.radius, 0, Math.PI * 2);
      context.stroke();
      if (fill) {
        context.fillStyle = color;
        context.fill();
      }
      context.restore();
    },

    drawAngle: function(start, angle, color, fill, alpha) {
      if (alpha === undefined) alpha = 0.6;
      var context = window.mc?.getContext('2d');
      if (!context) return;
      context.save();
      context.globalAlpha = alpha;
      context.beginPath();
      context.moveTo(window.mc.width / 2, window.mc.height / 2);
      context.arc(window.mc.width / 2, window.mc.height / 2, window.gsc * 100, start, angle);
      context.lineTo(window.mc.width / 2, window.mc.height / 2);
      context.closePath();
      context.stroke();
      if (fill) {
        context.fillStyle = color;
        context.fill();
      }
      context.restore();
    },

    drawLine: function(p1, p2, color, width) {
      if (width === undefined) width = 5;
      var context = window.mc?.getContext('2d');
      if (!context) return;
      var dp1 = canvas.mapToCanvas(p1);
      var dp2 = canvas.mapToCanvas(p2);
      context.save();
      context.beginPath();
      context.lineWidth = width * window.gsc;
      context.strokeStyle = color;
      context.moveTo(dp1.x, dp1.y);
      context.lineTo(dp2.x, dp2.y);
      context.stroke();
      context.restore();
    },

    isLeft: function(start, end, point) {
      return ((end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x)) > 0;
    },

    getDistance2: function(x1, y1, x2, y2) {
      var distance2 = Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
      return distance2;
    },

    getDistance2FromSnake: function(point) {
      point.distance = canvas.getDistance2(window.snake.xx, window.snake.yy, point.xx, point.yy);
      return point;
    },

    unitVector: function(v) {
      var l = Math.sqrt(v.x * v.x + v.y * v.y);
      if (l > 0) {
        return { x: v.x / l, y: v.y / l };
      } else {
        return { x: 0, y: 0 };
      }
    },

    pointInRect: function(point, rect) {
      if (rect.x <= point.x && rect.y <= point.y &&
          rect.x + rect.width >= point.x && rect.y + rect.height >= point.y) {
        return true;
      }
      return false;
    },

    pointInPoly: function(point, poly) {
      if (point.x < poly.minx || point.x > poly.maxx ||
          point.y < poly.miny || point.y > poly.maxy) {
        return false;
      }
      let c = false;
      const l = poly.pts.length;
      for (let i = 0, j = l - 1; i < l; j = i++) {
        if (((poly.pts[i].y > point.y) != (poly.pts[j].y > point.y)) &&
            (point.x < (poly.pts[j].x - poly.pts[i].x) * (point.y - poly.pts[i].y) /
             (poly.pts[j].y - poly.pts[i].y) + poly.pts[i].x)) {
          c = !c;
        }
      }
      return c;
    },

    addPolyBox: function(poly) {
      var minx = poly.pts[0].x;
      var maxx = poly.pts[0].x;
      var miny = poly.pts[0].y;
      var maxy = poly.pts[0].y;
      for (let p = 1, l = poly.pts.length; p < l; p++) {
        if (poly.pts[p].x < minx) minx = poly.pts[p].x;
        if (poly.pts[p].x > maxx) maxx = poly.pts[p].x;
        if (poly.pts[p].y < miny) miny = poly.pts[p].y;
        if (poly.pts[p].y > maxy) maxy = poly.pts[p].y;
      }
      return { pts: poly.pts, minx: minx, maxx: maxx, miny: miny, maxy: maxy };
    },

    cross: function(o, a, b) {
      return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    },

    convexHullSort: function(a, b) {
      return a.x == b.x ? a.y - b.y : a.x - b.x;
    },

    convexHull: function(points) {
      points.sort(canvas.convexHullSort);
      var lower = [];
      for (let i = 0, l = points.length; i < l; i++) {
        while (lower.length >= 2 && canvas.cross(
          lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
          lower.pop();
        }
        lower.push(points[i]);
      }
      var upper = [];
      for (let i = points.length - 1; i >= 0; i--) {
        while (upper.length >= 2 && canvas.cross(
          upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
          upper.pop();
        }
        upper.push(points[i]);
      }
      upper.pop();
      lower.pop();
      return lower.concat(upper);
    },

    circleIntersect: function(circle1, circle2) {
      var bothRadii = circle1.radius + circle2.radius;
      if (circle1.x + bothRadii > circle2.x &&
          circle1.y + bothRadii > circle2.y &&
          circle1.x < circle2.x + bothRadii &&
          circle1.y < circle2.y + bothRadii) {
        var distance2 = canvas.getDistance2(circle1.x, circle1.y, circle2.x, circle2.y);
        if (distance2 < bothRadii * bothRadii) {
          var point = {
            x: ((circle1.x * circle2.radius) + (circle2.x * circle1.radius)) / bothRadii,
            y: ((circle1.y * circle2.radius) + (circle2.y * circle1.radius)) / bothRadii,
            ang: 0.0
          };
          point.ang = canvas.fastAtan2(point.y - window.snake.yy, point.x - window.snake.xx);
          if (window.visualDebugging) {
            var collisionPointCircle = canvas.circle(point.x, point.y, 5);
            canvas.drawCircle(circle2, '#ff9900', false);
            canvas.drawCircle(collisionPointCircle, '#66ff66', true);
          }
          return point;
        }
      }
      return false;
    }
  };

  // === Bot Module ===
  var bot = window.bot = {
    isBotRunning: false,
    isBotEnabled: false, // Default to false, toggled by 'T' key
    stage: 'grow',
    collisionPoints: [],
    collisionAngles: [],
    foodAngles: [],
    scores: [],
    foodTimeout: undefined,
    sectorBoxSide: 0,
    defaultAccel: 0,
    sectorBox: {},
    currentFood: {},
    opt: {
      targetFps: 20,
      arcSize: Math.PI / 8,
      radiusMult: 10,
      foodAccelSz: 200,
      foodAccelDa: Math.PI / 2,
      actionFrames: 2,
      collisionDelay: 10,
      speedBase: 5.78,
      frontAngle: Math.PI / 2,
      enCircleThreshold: 0.5625,
      enCircleAllThreshold: 0.5625,
      enCircleDistanceMult: 20,
      followCircleLength: 5000,
      followCircleDirection: +1
    },
    MID_X: 0,
    MID_Y: 0,
    MAP_R: 0,
    MAXARC: 0,

    getSnakeWidth: function(sc) {
      if (sc === undefined) sc = window.snake?.sc || 1;
      return Math.round(sc * 29.0);
    },

    quickRespawn: function() {
      window.dead_mtm = 0;
      window.login_fr = 0;
      bot.isBotRunning = false;
      window.forcing = true;
      bot.connect();
      window.forcing = false;
    },

    connect: function() {
      if (window.force_ip && window.force_port) {
        window.forceServer?.(window.force_ip, window.force_port);
      }
      window.connect?.();
    },

    angleBetween: function(a1, a2) {
      var r1 = (a1 - a2) % Math.PI;
      var r2 = (a2 - a1) % Math.PI;
      return r1 < r2 ? -r1 : r2;
    },

    changeHeadingAbs: function(angle) {
      var cos = Math.cos(angle);
      var sin = Math.sin(angle);
      window.goalCoordinates = {
        x: Math.round(window.snake.xx + (bot.headCircle?.radius || 100) * cos),
        y: Math.round(window.snake.yy + (bot.headCircle?.radius || 100) * sin)
      };
      canvas.setMouseCoordinates(canvas.mapToMouse(window.goalCoordinates));
    },

    changeHeadingRel: function(angle) {
      var heading = {
        x: window.snake.xx + 500 * bot.cos,
        y: window.snake.yy + 500 * bot.sin
      };
      var cos = Math.cos(-angle);
      var sin = Math.sin(-angle);
      window.goalCoordinates = {
        x: Math.round(cos * (heading.x - window.snake.xx) - sin * (heading.y - window.snake.yy) + window.snake.xx),
        y: Math.round(sin * (heading.x - window.snake.xx) + cos * (heading.y - window.snake.yy) + window.snake.yy)
      };
      canvas.setMouseCoordinates(canvas.mapToMouse(window.goalCoordinates));
    },

    headingBestAngle: function() {
      var best, distance, openAngles = [], openStart;
      var sIndex = bot.getAngleIndex(window.snake.ehang) + bot.MAXARC / 2;
      if (sIndex > bot.MAXARC) sIndex -= bot.MAXARC;

      for (var i = 0; i < bot.MAXARC; i++) {
        if (bot.collisionAngles[i] === undefined) {
          distance = 0;
          if (openStart === undefined) openStart = i;
        } else {
          distance = bot.collisionAngles[i].distance;
          if (openStart !== undefined) {
            openAngles.push({ openStart: openStart, openEnd: i - 1, sz: (i - 1) - openStart });
            openStart = undefined;
          }
        }
        if (best === undefined || (best.distance < distance && best.distance !== 0)) {
          best = { distance: distance, aIndex: i };
        }
      }

      if (openStart !== undefined && openAngles[0]) {
        openAngles[0].openStart = openStart;
        openAngles[0].sz = openAngles[0].openEnd - openStart;
        if (openAngles[0].sz < 0) openAngles[0].sz += bot.MAXARC;
      } else if (openStart !== undefined) {
        openAngles.push({ openStart: openStart, openEnd: openStart, sz: 0 });
      }

      if (openAngles.length > 0) {
        openAngles.sort(bot.sortSz);
        bot.changeHeadingAbs((openAngles[0].openEnd - openAngles[0].sz / 2) * bot.opt.arcSize);
      } else {
        bot.changeHeadingAbs(best.aIndex * bot.opt.arcSize);
      }
    },

    avoidCollisionPoint: function(point, ang) {
      if (ang === undefined || ang > Math.PI) ang = Math.PI;
      var end = { x: window.snake.xx + 2000 * bot.cos, y: window.snake.yy + 2000 * bot.sin };
      if (window.visualDebugging) {
        canvas.drawLine({ x: window.snake.xx, y: window.snake.yy }, end, 'orange', 5);
        canvas.drawLine({ x: window.snake.xx, y: window.snake.yy }, { x: point.x, y: point.y }, 'red', 5);
      }
      if (canvas.isLeft({ x: window.snake.xx, y: window.snake.yy }, end, { x: point.x, y: point.y })) {
        bot.changeHeadingAbs(point.ang - ang);
      } else {
        bot.changeHeadingAbs(point.ang + ang);
      }
    },

    getAngleIndex: function(angle) {
      if (angle < 0) angle += 2 * Math.PI;
      var index = Math.round(angle * (1 / bot.opt.arcSize));
      return index === bot.MAXARC ? 0 : index;
    },

    addCollisionAngle: function(sp) {
      var ang = canvas.fastAtan2(Math.round(sp.yy - window.snake.yy), Math.round(sp.xx - window.snake.xx));
      var aIndex = bot.getAngleIndex(ang);
      var actualDistance = Math.round(Math.pow(Math.sqrt(sp.distance) - sp.radius, 2));
      if (bot.collisionAngles[aIndex] === undefined || bot.collisionAngles[aIndex].distance > sp.distance) {
        bot.collisionAngles[aIndex] = {
          x: Math.round(sp.xx), y: Math.round(sp.yy), ang: ang, snake: sp.snake,
          distance: actualDistance, radius: sp.radius, aIndex: aIndex
        };
      }
    },

    addFoodAngle: function(f) {
      var ang = canvas.fastAtan2(Math.round(f.yy - window.snake.yy), Math.round(f.xx - window.snake.xx));
      var aIndex = bot.getAngleIndex(ang);
      canvas.getDistance2FromSnake(f);
      if (bot.collisionAngles[aIndex] === undefined ||
          Math.sqrt(bot.collisionAngles[aIndex].distance) >
          Math.sqrt(f.distance) + bot.snakeRadius * bot.opt.radiusMult * bot.speedMult / 2) {
        if (bot.foodAngles[aIndex] === undefined) {
          bot.foodAngles[aIndex] = {
            x: Math.round(f.xx), y: Math.round(f.yy), ang: ang,
            da: Math.abs(bot.angleBetween(ang, window.snake.ehang)),
            distance: f.distance, sz: f.sz, score: Math.pow(f.sz, 2) / f.distance
          };
        } else {
          bot.foodAngles[aIndex].sz += Math.round(f.sz);
          bot.foodAngles[aIndex].score += Math.pow(f.sz, 2) / f.distance;
          if (bot.foodAngles[aIndex].distance > f.distance) {
            bot.foodAngles[aIndex].x = Math.round(f.xx);
            bot.foodAngles[aIndex].y = Math.round(f.yy);
            bot.foodAngles[aIndex].distance = f.distance;
          }
        }
      }
    },

    getCollisionPoints: function() {
      var scPoint;
      bot.collisionPoints = [];
      bot.collisionAngles = [];
      for (var snake = 0, ls = window.snakes?.length || 0; snake < ls; snake++) {
        scPoint = undefined;
        if (window.snakes[snake].id !== window.snake.id && window.snakes[snake].alive_amt === 1) {
          var s = window.snakes[snake];
          var sRadius = bot.getSnakeWidth(s.sc) / 2;
          var sSpMult = Math.min(1, s.sp / 5.78 - 1);
          scPoint = {
            xx: s.xx + Math.cos(s.ehang) * sRadius * sSpMult * bot.opt.radiusMult / 2,
            yy: s.yy + Math.sin(s.ehang) * sRadius * sSpMult * bot.opt.radiusMult / 2,
            snake: snake, radius: bot.headCircle?.radius || 100, head: true
          };
          canvas.getDistance2FromSnake(scPoint);
          bot.addCollisionAngle(scPoint);
          bot.collisionPoints.push(scPoint);
          if (window.visualDebugging) {
            canvas.drawCircle(canvas.circle(scPoint.xx, scPoint.yy, scPoint.radius), 'red', false);
          }
          scPoint = undefined;
          for (var pts = 0, lp = s.pts.length; pts < lp; pts++) {
            if (!s.pts[pts].dying && canvas.pointInRect({ x: s.pts[pts].xx, y: s.pts[pts].yy }, bot.sectorBox)) {
              var collisionPoint = { xx: s.pts[pts].xx, yy: s.pts[pts].yy, snake: snake, radius: sRadius };
              if (window.visualDebugging && false) {
                canvas.drawCircle(canvas.circle(collisionPoint.xx, collisionPoint.yy, collisionPoint.radius), '#00FF00', false);
              }
              canvas.getDistance2FromSnake(collisionPoint);
              bot.addCollisionAngle(collisionPoint);
              if (collisionPoint.distance <= Math.pow((bot.headCircle?.radius || 100) + collisionPoint.radius, 2)) {
                bot.collisionPoints.push(collisionPoint);
                if (window.visualDebugging) {
                  canvas.drawCircle(canvas.circle(collisionPoint.xx, collisionPoint.yy, collisionPoint.radius), 'red', false);
                }
              }
            }
          }
        }
      }
      if (canvas.getDistance2(bot.MID_X, bot.MID_Y, window.snake.xx, window.snake.yy) > Math.pow(bot.MAP_R - 1000, 2)) {
        var midAng = canvas.fastAtan2(window.snake.yy - bot.MID_X, window.snake.xx - bot.MID_Y);
        scPoint = { xx: bot.MID_X + bot.MAP_R * Math.cos(midAng), yy: bot.MID_Y + bot.MAP_R * Math.sin(midAng), snake: -1, radius: bot.snakeWidth };
        canvas.getDistance2FromSnake(scPoint);
        bot.collisionPoints.push(scPoint);
        bot.addCollisionAngle(scPoint);
        if (window.visualDebugging) {
          canvas.drawCircle(canvas.circle(scPoint.xx, scPoint.yy, scPoint.radius), 'yellow', false);
        }
      }
      bot.collisionPoints.sort(bot.sortDistance);
      if (window.visualDebugging) {
        for (var i = 0; i < bot.collisionAngles.length; i++) {
          if (bot.collisionAngles[i] !== undefined) {
            canvas.drawLine({ x: window.snake.xx, y: window.snake.yy }, { x: bot.collisionAngles[i].x, y: bot.collisionAngles[i].y }, 'red', 2);
          }
        }
      }
    },

    inFrontAngle: function(point) {
      var ang = canvas.fastAtan2(Math.round(point.y - window.snake.yy), Math.round(point.x - window.snake.xx));
      return Math.abs(bot.angleBetween(ang, window.snake.ehang)) < bot.opt.frontAngle;
    },

    checkCollision: function() {
      var point;
      bot.getCollisionPoints();
      if (bot.collisionPoints.length === 0) return false;
      for (var i = 0; i < bot.collisionPoints.length; i++) {
        var collisionCircle = canvas.circle(bot.collisionPoints[i].xx, bot.collisionPoints[i].yy, bot.collisionPoints[i].radius);
        if ((point = canvas.circleIntersect(bot.headCircle, collisionCircle)) && bot.inFrontAngle(point)) {
          if (bot.collisionPoints[i].snake !== -1 && bot.collisionPoints[i].head && window.snakes[bot.collisionPoints[i].snake].sp > 10) {
            window.setAcceleration?.(1);
          } else {
            window.setAcceleration?.(bot.defaultAccel);
          }
          bot.avoidCollisionPoint(point);
          return true;
        }
      }
      window.setAcceleration?.(bot.defaultAccel);
      return false;
    },

    checkEncircle: function() {
      var enSnake = [], high = 0, highSnake, enAll = 0;
      for (var i = 0; i < bot.collisionAngles.length; i++) {
        if (bot.collisionAngles[i] !== undefined) {
          var s = bot.collisionAngles[i].snake;
          if (enSnake[s]) enSnake[s]++; else enSnake[s] = 1;
          if (enSnake[s] > high) { high = enSnake[s]; highSnake = s; }
          if (bot.collisionAngles[i].distance < Math.pow(bot.snakeRadius * bot.opt.enCircleDistanceMult, 2)) enAll++;
        }
      }
      if (high > bot.MAXARC * bot.opt.enCircleThreshold) {
        bot.headingBestAngle();
        if (high !== bot.MAXARC && window.snakes[highSnake]?.sp > 10) window.setAcceleration?.(1); else window.setAcceleration?.(bot.defaultAccel);
        if (window.visualDebugging) {
          canvas.drawCircle(canvas.circle(window.snake.xx, window.snake.yy, bot.opt.radiusMult * bot.snakeRadius), 'red', true, 0.2);
        }
        return true;
      }
      if (enAll > bot.MAXARC * bot.opt.enCircleAllThreshold) {
        bot.headingBestAngle();
        window.setAcceleration?.(bot.defaultAccel);
        if (window.visualDebugging) {
          canvas.drawCircle(canvas.circle(window.snake.xx, window.snake.yy, bot.snakeRadius * bot.opt.enCircleDistanceMult), 'yellow', true, 0.2);
        }
        return true;
      } else {
        if (window.visualDebugging) {
          canvas.drawCircle(canvas.circle(window.snake.xx, window.snake.yy, bot.snakeRadius * bot.opt.enCircleDistanceMult), 'yellow');
        }
      }
      window.setAcceleration?.(bot.defaultAccel);
      return false;
    },

    populatePts: function() {
      let x = window.snake.xx + window.snake.fx, y = window.snake.yy + window.snake.fy, l = 0.0;
      bot.pts = [{ x: x, y: y, len: l }];
      for (let p = window.snake.pts.length - 1; p >= 0; p--) {
        if (window.snake.pts[p].dying) continue;
        let xx = window.snake.pts[p].xx + window.snake.pts[p].fx, yy = window.snake.pts[p].yy + window.snake.pts[p].fy;
        let ll = l + Math.sqrt(canvas.getDistance2(x, y, xx, yy));
        bot.pts.push({ x: xx, y: yy, len: ll });
        x = xx; y = yy; l = ll;
      }
      bot.len = l;
    },

    determineCircleDirection: function() {
      let cx = 0.0, cy = 0.0, pn = bot.pts.length;
      for (let p = 0; p < pn; p++) { cx += bot.pts[p].x; cy += bot.pts[p].y; }
      cx /= pn; cy /= pn;
      let head = { x: window.snake.xx + window.snake.fx, y: window.snake.yy + window.snake.fy };
      let dx = head.x - cx, dy = head.y - cy;
      bot.opt.followCircleDirection = (-dy * bot.cos + dx * bot.sin > 0) ? -1 : +1;
    },

    smoothPoint: function(t) {
      if (t >= bot.len) return { x: bot.pts[bot.pts.length - 1].x, y: bot.pts[bot.pts.length - 1].y };
      if (t <= 0) return { x: bot.pts[0].x, y: bot.pts[0].y };
      let p = 0, q = bot.pts.length - 1;
      while (q - p > 1) {
        let m = Math.round((p + q) / 2);
        if (t > bot.pts[m].len) p = m; else q = m;
      }
      let wp = bot.pts[q].len - t, wq = t - bot.pts[p].len, w = wp + wq;
      return {
        x: (wp * bot.pts[p].x + wq * bot.pts[q].x) / w,
        y: (wp * bot.pts[p].y + wq * bot.pts[q].y) / w
      };
    },

    closestBodyPoint: function() {
      let head = { x: window.snake.xx + window.snake.fx, y: window.snake.yy + window.snake.fy };
      let ptsLength = bot.pts.length, start_n = 0, start_d2 = 0.0;
      for (;;) {
        let prev_d2 = start_d2;
        start_n++;
        start_d2 = canvas.getDistance2(head.x, head.y, bot.pts[start_n].x, bot.pts[start_n].y);
        if (start_d2 < prev_d2 || start_n == ptsLength - 1) break;
      }
      if (start_n >= ptsLength || start_n <= 1) return bot.len;
      let min_n = start_n, min_d2 = start_d2;
      for (let n = min_n + 1; n < ptsLength; n++) {
        let d2 = canvas.getDistance2(head.x, head.y, bot.pts[n].x, bot.pts[n].y);
        if (d2 < min_d2) { min_n = n; min_d2 = d2; }
      }
      let next_n = min_n, next_d2 = min_d2;
      if (min_n == ptsLength - 1) {
        next_n = min_n - 1;
        next_d2 = canvas.getDistance2(head.x, head.y, bot.pts[next_n].x, bot.pts[next_n].y);
      } else {
        let d2m = canvas.getDistance2(head.x, head.y, bot.pts[min_n - 1].x, bot.pts[min_n - 1].y);
        let d2p = canvas.getDistance2(head.x, head.y, bot.pts[min_n + 1].x, bot.pts[min_n + 1].y);
        if (d2m < d2p) { next_n = min_n - 1; next_d2 = d2m; } else { next_n = min_n + 1; next_d2 = d2p; }
      }
      let t2 = bot.pts[min_n].len - bot.pts[next_n].len;
      t2 *= t2;
      if (t2 == 0) return bot.pts[min_n].len;
      let min_w = t2 - (min_d2 - next_d2), next_w = t2 + (min_d2 - next_d2);
      return (bot.pts[min_n].len * min_w + bot.pts[next_n].len * next_w) / (2 * t2);
    },

    bodyDangerZone: function(offset, targetPoint, targetPointNormal, closePointDist, pastTargetPoint, closePoint) {
      var head = { x: window.snake.xx + window.snake.fx, y: window.snake.yy + window.snake.fy };
      const o = bot.opt.followCircleDirection;
      var pts = [
        { x: head.x - o * offset * bot.sin, y: head.y + o * offset * bot.cos },
        { x: head.x + bot.snakeWidth * bot.cos + offset * (bot.cos - o * bot.sin),
          y: head.y + bot.snakeWidth * bot.sin + offset * (bot.sin + o * bot.cos) },
        { x: head.x + 1.75 * bot.snakeWidth * bot.cos + o * 0.3 * bot.snakeWidth * bot.sin + offset * (bot.cos - o * bot.sin),
          y: head.y + 1.75 * bot.snakeWidth * bot.sin - o * 0.3 * bot.snakeWidth * bot.cos + offset * (bot.sin + o * bot.cos) },
        { x: head.x + 2.5 * bot.snakeWidth * bot.cos + o * 0.7 * bot.snakeWidth * bot.sin + offset * (bot.cos - o * bot.sin),
          y: head.y + 2.5 * bot.snakeWidth * bot.sin - o * 0.7 * bot.snakeWidth * bot.cos + offset * (bot.sin + o * bot.cos) },
        { x: head.x + 3 * bot.snakeWidth * bot.cos + o * 1.2 * bot.snakeWidth * bot.sin + offset * bot.cos,
          y: head.y + 3 * bot.snakeWidth * bot.sin - o * 1.2 * bot.snakeWidth * bot.cos + offset * bot.sin },
        { x: targetPoint.x + targetPointNormal.x * (offset + 0.5 * Math.max(closePointDist, 0)),
          y: targetPoint.y + targetPointNormal.y * (offset + 0.5 * Math.max(closePointDist, 0)) },
        { x: pastTargetPoint.x + targetPointNormal.x * offset,
          y: pastTargetPoint.y + targetPointNormal.y * offset },
        pastTargetPoint,
        targetPoint,
        closePoint
      ];
      pts = canvas.convexHull(pts);
      var poly = { pts: pts };
      return canvas.addPolyBox(poly);
    },

    followCircleSelf: function() {
      bot.populatePts();
      bot.determineCircleDirection();
      const o = bot.opt.followCircleDirection;
      if (bot.len < 9 * bot.snakeWidth) return;
      var head = { x: window.snake.xx + window.snake.fx, y: window.snake.yy + window.snake.fy };
      let closePointT = bot.closestBodyPoint(), closePoint = bot.smoothPoint(closePointT);
      var closePointNext = bot.smoothPoint(closePointT - bot.snakeWidth);
      var closePointTangent = canvas.unitVector({ x: closePointNext.x - closePoint.x, y: closePointNext.y - closePoint.y });
      var closePointNormal = { x: -o * closePointTangent.y, y: o * closePointTangent.x };
      var currentCourse = Math.asin(Math.max(-1, Math.min(1, bot.cos * closePointNormal.x + bot.sin * closePointNormal.y)));
      var closePointDist = (head.x - closePoint.x) * closePointNormal.x + (head.y - closePoint.y) * closePointNormal.y;
      var insidePolygonStartT = 5 * bot.snakeWidth, insidePolygonEndT = closePointT + 5 * bot.snakeWidth;
      var insidePolygonPts = [bot.smoothPoint(insidePolygonEndT), bot.smoothPoint(insidePolygonStartT)];
      for (let t = insidePolygonStartT; t < insidePolygonEndT; t += bot.snakeWidth) insidePolygonPts.push(bot.smoothPoint(t));
      var insidePolygon = canvas.addPolyBox({ pts: insidePolygonPts });
      var targetPointT = closePointT, targetPointFar = 0.0, targetPointStep = bot.snakeWidth / 64;
      for (let h = closePointDist, a = currentCourse; h >= 0.125 * bot.snakeWidth;) {
        targetPointT -= targetPointStep; targetPointFar += targetPointStep * Math.cos(a);
        h += targetPointStep * Math.sin(a); a = Math.max(-Math.PI / 4, a - targetPointStep / bot.snakeWidth);
      }
      var targetPoint = bot.smoothPoint(targetPointT);
      var pastTargetPointT = targetPointT - 3 * bot.snakeWidth, pastTargetPoint = bot.smoothPoint(pastTargetPointT);
      var enemyBodyOffsetDelta = 0.25 * bot.snakeWidth, enemyHeadDist2 = 64 * 64 * bot.snakeWidth * bot.snakeWidth;
      for (let snake = 0, snakesNum = window.snakes?.length || 0; snake < snakesNum; snake++) {
        if (window.snakes[snake].id !== window.snake.id && window.snakes[snake].alive_amt === 1) {
          let enemyHead = { x: window.snakes[snake].xx + window.snakes[snake].fx, y: window.snakes[snake].yy + window.snakes[snake].fy };
          let enemyAhead = {
            x: enemyHead.x + Math.cos(window.snakes[snake].ang) * bot.snakeWidth,
            y: enemyHead.y + Math.sin(window.snakes[snake].ang) * bot.snakeWidth
          };
          if (!canvas.pointInPoly(enemyHead, insidePolygon)) {
            enemyHeadDist2 = Math.min(
              enemyHeadDist2,
              canvas.getDistance2(enemyHead.x, enemyHead.y, targetPoint.x, targetPoint.y),
              canvas.getDistance2(enemyAhead.x, enemyAhead.y, targetPoint.x, targetPoint.y)
            );
          }
          let offsetSet = false, offset = 0.0, cpolbody = {};
          for (let pts = 0, ptsNum = window.snakes[snake].pts.length; pts < ptsNum; pts++) {
            if (!window.snakes[snake].pts[pts].dying) {
              let point = {
                x: window.snakes[snake].pts[pts].xx + window.snakes[snake].pts[pts].fx,
                y: window.snakes[snake].pts[pts].yy + window.snakes[snake].pts[pts].fy
              };
              while (!offsetSet || (enemyBodyOffsetDelta >= -bot.snakeWidth && canvas.pointInPoly(point, cpolbody))) {
                if (!offsetSet) offsetSet = true;
                else enemyBodyOffsetDelta -= 0.0625 * bot.snakeWidth;
                offset = 0.5 * (bot.snakeWidth + bot.getSnakeWidth(window.snakes[snake].sc)) + enemyBodyOffsetDelta;
                cpolbody = bot.bodyDangerZone(offset, targetPoint, closePointNormal, closePointDist, pastTargetPoint, closePoint);
              }
            }
          }
        }
      }
      var enemyHeadDist = Math.sqrt(enemyHeadDist2);
      if (window.visualDebugging) {
        for (let p = 0, l = insidePolygon.pts.length; p < l; p++) {
          let q = p + 1;
          if (q == l) q = 0;
          canvas.drawLine({ x: insidePolygon.pts[p].x, y: insidePolygon.pts[p].y },
                          { x: insidePolygon.pts[q].x, y: insidePolygon.pts[q].y }, 'orange');
        }
        canvas.drawCircle(canvas.circle(closePoint.x, closePoint.y, bot.snakeWidth * 0.25), 'white', false);
        canvas.drawCircle(canvas.circle(targetPoint.x, targetPoint.y, bot.snakeWidth + 2 * targetPointFar), 'white', false);
        canvas.drawCircle(canvas.circle(targetPoint.x, targetPoint.y, 0.2 * bot.snakeWidth), 'white', false);
        let soffset = 0.5 * bot.snakeWidth;
        let scpolbody = bot.bodyDangerZone(soffset, targetPoint, closePointNormal, closePointDist, pastTargetPoint, closePoint);
        for (let p = 0, l = scpolbody.pts.length; p < l; p++) {
          let q = p + 1;
          if (q == l) q = 0;
          canvas.drawLine({ x: scpolbody.pts[p].x, y: scpolbody.pts[p].y },
                          { x: scpolbody.pts[q].x, y: scpolbody.pts[q].y }, 'white');
        }
      }
      let targetCourse = currentCourse + 0.25;
      let headProx = -1.0 - (2 * targetPointFar - enemyHeadDist) / bot.snakeWidth;
      if (headProx > 0) headProx = 0.125 * headProx * headProx; else headProx = -0.5 * headProx * headProx;
      targetCourse = Math.min(targetCourse, headProx);
      targetCourse = Math.min(targetCourse, targetCourse + (enemyBodyOffsetDelta - 0.0625 * bot.snakeWidth) / bot.snakeWidth);
      var tailBehind = bot.len - closePointT;
      var targetDir = canvas.unitVector({ x: targetPoint.x - head.x, y: targetPoint.y - head.y });
      var driftQ = targetDir.x * closePointNormal.x + targetDir.y * closePointNormal.y;
      var allowTail = bot.snakeWidth * (2 - 0.5 * driftQ);
      if (window.visualDebugging) {
        canvas.drawLine({ x: head.x, y: head.y }, { x: head.x + allowTail * targetDir.x, y: head.y + allowTail * targetDir.y }, 'red');
      }
      targetCourse = Math.min(targetCourse, (tailBehind - allowTail + (bot.snakeWidth - closePointDist)) / bot.snakeWidth);
      targetCourse = Math.min(targetCourse, -0.5 * (closePointDist - 4 * bot.snakeWidth) / bot.snakeWidth);
      targetCourse = Math.max(targetCourse, -0.75 * closePointDist / bot.snakeWidth);
      targetCourse = Math.min(targetCourse, 1.0);
      var goalDir = {
        x: closePointTangent.x * Math.cos(targetCourse) - o * closePointTangent.y * Math.sin(targetCourse),
        y: closePointTangent.y * Math.cos(targetCourse) + o * closePointTangent.x * Math.sin(targetCourse)
      };
      var goal = { x: head.x + goalDir.x * 4 * bot.snakeWidth, y: head.y + goalDir.y * 4 * bot.snakeWidth };
      if (window.goalCoordinates && Math.abs(goal.x - window.goalCoordinates.x) < 1000 && Math.abs(goal.y - window.goalCoordinates.y) < 1000) {
        window.goalCoordinates = {
          x: Math.round(goal.x * 0.25 + window.goalCoordinates.x * 0.75),
          y: Math.round(goal.y * 0.25 + window.goalCoordinates.y * 0.75)
        };
      } else {
        window.goalCoordinates = { x: Math.round(goal.x), y: Math.round(goal.y) };
      }
      canvas.setMouseCoordinates(canvas.mapToMouse(window.goalCoordinates));
    },

    sortScore: function(a, b) { return b.score - a.score; },
    sortSz: function(a, b) { return b.sz - a.sz; },
    sortDistance: function(a, b) { return a.distance - b.distance; },

    computeFoodGoal: function() {
      bot.foodAngles = [];
      for (var i = 0; i < (window.foods?.length || 0) && window.foods[i] !== null; i++) {
        var f = window.foods[i];
        if (!f.eaten && !(canvas.circleIntersect(canvas.circle(f.xx, f.yy, 2), bot.sidecircle_l) || canvas.circleIntersect(canvas.circle(f.xx, f.yy, 2), bot.sidecircle_r))) {
          bot.addFoodAngle(f);
        }
      }
      bot.foodAngles.sort(bot.sortScore);
      if (bot.foodAngles[0] !== undefined && bot.foodAngles[0].sz > 0) {
        bot.currentFood = { x: bot.foodAngles[0].x, y: bot.foodAngles[0].y, sz: bot.foodAngles[0].sz, da: bot.foodAngles[0].da };
      } else {
        bot.currentFood = { x: bot.MID_X, y: bot.MID_Y, sz: 0 };
      }
    },

    foodAccel: function() {
      var aIndex = 0;
      if (bot.currentFood && bot.currentFood.sz > bot.opt.foodAccelSz) {
        aIndex = bot.getAngleIndex(bot.currentFood.ang);
        if (bot.collisionAngles[aIndex] && bot.collisionAngles[aIndex].distance > bot.currentFood.distance + bot.snakeRadius * bot.opt.radiusMult && bot.currentFood.da < bot.opt.foodAccelDa) return 1;
        if (bot.collisionAngles[aIndex] === undefined && bot.currentFood.da < bot.opt.foodAccelDa) return 1;
      }
      return bot.defaultAccel;
    },

    toCircle: function() {
      for (var i = 0; i < window.snake.pts.length && window.snake.pts[i].dying; i++);
      const o = bot.opt.followCircleDirection;
      var tailCircle = canvas.circle(window.snake.pts[i].xx, window.snake.pts[i].yy, bot.headCircle?.radius || 100);
      if (window.visualDebugging) {
        canvas.drawCircle(tailCircle, 'blue', false);
      }
      window.setAcceleration?.(bot.defaultAccel);
      bot.changeHeadingRel(o * Math.PI / 32);
      if (canvas.circleIntersect(bot.headCircle, tailCircle)) {
        bot.stage = 'circle';
      }
    },

    every: function() {
      bot.MID_X = window.grd || 0;
      bot.MID_Y = window.grd || 0;
      bot.MAP_R = window.grd * 0.98 || 0;
      bot.MAXARC = (2 * Math.PI) / bot.opt.arcSize;
      if (bot.opt.followCircleTarget === undefined) {
        bot.opt.followCircleTarget = { x: bot.MID_X, y: bot.MID_Y };
      }
      bot.sectorBoxSide = Math.floor(Math.sqrt(window.sectors?.length || 0)) * (window.sector_size || 0);
      bot.sectorBox = canvas.rect(window.snake.xx - (bot.sectorBoxSide / 2), window.snake.yy - (bot.sectorBoxSide / 2), bot.sectorBoxSide, bot.sectorBoxSide);
      bot.cos = Math.cos(window.snake.ang);
      bot.sin = Math.sin(window.snake.ang);
      bot.speedMult = window.snake.sp / bot.opt.speedBase;
      bot.snakeRadius = bot.getSnakeWidth() / 2;
      bot.snakeWidth = bot.getSnakeWidth();
      bot.snakeLength = Math.floor(15 * (window.fpsls[window.snake.sct] + window.snake.fam / window.fmlts[window.snake.sct] - 1) - 5);
      bot.headCircle = canvas.circle(
        window.snake.xx + bot.cos * Math.min(1, bot.speedMult - 1) * bot.opt.radiusMult / 2 * bot.snakeRadius,
        window.snake.yy + bot.sin * Math.min(1, bot.speedMult - 1) * bot.opt.radiusMult / 2 * bot.snakeRadius,
        bot.opt.radiusMult / 2 * bot.snakeRadius
      );
      if (window.visualDebugging) {
        canvas.drawCircle(bot.headCircle, 'blue', false);
      }
      bot.sidecircle_r = canvas.circle(
        window.snake.lnp.xx - ((window.snake.lnp.yy + bot.sin * bot.snakeWidth) - window.snake.lnp.yy),
        window.snake.lnp.yy + ((window.snake.lnp.xx + bot.cos * bot.snakeWidth) - window.snake.lnp.xx),
        bot.snakeWidth * bot.speedMult
      );
      bot.sidecircle_l = canvas.circle(
        window.snake.lnp.xx + ((window.snake.lnp.yy + bot.sin * bot.snakeWidth) - window.snake.lnp.yy),
        window.snake.lnp.yy - ((window.snake.lnp.xx + bot.cos * bot.snakeWidth) - window.snake.lnp.xx),
        bot.snakeWidth * bot.speedMult
      );
    },

    go: function() {
      bot.every();
      if (bot.snakeLength < bot.opt.followCircleLength) bot.stage = 'grow';
      if (bot.currentFood && bot.stage !== 'grow') bot.currentFood = undefined;
      if (bot.stage === 'circle') {
        window.setAcceleration?.(bot.defaultAccel);
        bot.followCircleSelf();
      } else if (bot.checkCollision() || bot.checkEncircle()) {
        if (bot.actionTimeout) {
          window.clearTimeout(bot.actionTimeout);
          bot.actionTimeout = window.setTimeout(bot.actionTimer, 1000 / bot.opt.targetFps * bot.opt.collisionDelay);
        }
      } else {
        if (bot.snakeLength > bot.opt.followCircleLength) bot.stage = 'tocircle';
        if (bot.actionTimeout === undefined) {
          bot.actionTimeout = window.setTimeout(bot.actionTimer, 1000 / bot.opt.targetFps * bot.opt.actionFrames);
        }
        window.setAcceleration?.(bot.foodAccel());
      }
    },

    actionTimer: function() {
      if (window.playing && window.snake !== null && window.snake.alive_amt === 1) {
        if (bot.stage === 'grow') {
          bot.computeFoodGoal();
          window.goalCoordinates = bot.currentFood;
          canvas.setMouseCoordinates(canvas.mapToMouse(window.goalCoordinates));
        } else if (bot.stage === 'tocircle') {
          bot.toCircle();
        }
      }
      bot.actionTimeout = undefined;
    }
  };

  // === User Interface Module ===
  var userInterface = window.userInterface = {
    overlays: {},
    gfxEnabled: true,

    initServerIp: function() {
      var parent = document.getElementById('playh');
      if (!parent) return;
      var serverDiv = document.createElement('div');
      var serverIn = document.createElement('input');
      serverDiv.style.width = '244px';
      serverDiv.style.margin = '-30px auto';
      serverDiv.style.boxShadow = 'rgb(0, 0, 0) 0px 6px 50px';
      serverDiv.style.opacity = 1;
      serverDiv.style.background = 'rgb(76, 68, 124)';
      serverDiv.className = 'taho';
      serverDiv.style.display = 'block';
      serverIn.className = 'sumsginp';
      serverIn.placeholder = '0.0.0.0:444';
      serverIn.maxLength = 21;
      serverIn.style.width = '220px';
      serverIn.style.height = '24px';
      serverDiv.appendChild(serverIn);
      parent.appendChild(serverDiv);
      userInterface.server = serverIn;
    },

    initOverlays: function() {
      var botOverlay = document.createElement('div');
      botOverlay.style.position = 'fixed';
      botOverlay.style.right = '5px';
      botOverlay.style.bottom = '112px';
      botOverlay.style.width = '150px';
      botOverlay.style.height = '85px';
      botOverlay.style.color = '#C0C0C0';
      botOverlay.style.fontFamily = 'Consolas, Verdana';
      botOverlay.style.zIndex = 999;
      botOverlay.style.fontSize = '14px';
      botOverlay.style.padding = '5px';
      botOverlay.style.borderRadius = '5px';
      botOverlay.className = 'nsi';
      document.body.appendChild(botOverlay);

      var serverOverlay = document.createElement('div');
      serverOverlay.style.position = 'fixed';
      serverOverlay.style.right = '5px';
      serverOverlay.style.bottom = '5px';
      serverOverlay.style.width = '160px';
      serverOverlay.style.height = '14px';
      serverOverlay.style.color = '#C0C0C0';
      serverOverlay.style.fontFamily = 'Consolas, Verdana';
      serverOverlay.style.zIndex = 999;
      serverOverlay.style.fontSize = '14px';
      serverOverlay.className = 'nsi';
      document.body.appendChild(serverOverlay);

      var prefOverlay = document.createElement('div');
      prefOverlay.style.position = 'fixed';
      prefOverlay.style.left = '10px';
      prefOverlay.style.top = '75px';
      prefOverlay.style.width = '260px';
      prefOverlay.style.height = '210px';
      prefOverlay.style.color = '#C0C0C0';
      prefOverlay.style.fontFamily = 'Consolas, Verdana';
      prefOverlay.style.zIndex = 999;
      prefOverlay.style.fontSize = '14px';
      prefOverlay.style.padding = '5px';
      prefOverlay.style.borderRadius = '5px';
      prefOverlay.className = 'nsi';
      document.body.appendChild(prefOverlay);

      var statsOverlay = document.createElement('div');
      statsOverlay.style.position = 'fixed';
      statsOverlay.style.left = '10px';
      statsOverlay.style.top = '295px';
      statsOverlay.style.width = '140px';
      statsOverlay.style.height = '210px';
      statsOverlay.style.color = '#C0C0C0';
      statsOverlay.style.fontFamily = 'Consolas, Verdana';
      statsOverlay.style.zIndex = 998;
      statsOverlay.style.fontSize = '14px';
      statsOverlay.style.padding = '5px';
      statsOverlay.style.borderRadius = '5px';
      statsOverlay.className = 'nsi';
      document.body.appendChild(statsOverlay);

      userInterface.overlays.botOverlay = botOverlay;
      userInterface.overlays.serverOverlay = serverOverlay;
      userInterface.overlays.prefOverlay = prefOverlay;
      userInterface.overlays.statsOverlay = statsOverlay;
    },

    toggleOverlays: function() {
      Object.keys(userInterface.overlays).forEach(function(okey) {
        var oVis = userInterface.overlays[okey].style.visibility !== 'hidden' ? 'hidden' : 'visible';
        userInterface.overlays[okey].style.visibility = oVis;
        window.visualDebugging = oVis === 'visible';
      });
    },

    toggleGfx: function() {
      if (userInterface.gfxEnabled) {
        var c = window.mc?.getContext('2d');
        if (c) {
          c.save();
          c.fillStyle = "#000000";
          c.fillRect(0, 0, window.mww || 0, window.mhh || 0);
          c.restore();
        }
        var d = document.createElement('div');
        d.style.position = 'fixed';
        d.style.top = '50%';
        d.style.left = '50%';
        d.style.width = '200px';
        d.style.height = '60px';
        d.style.color = '#C0C0C0';
        d.style.fontFamily = 'Consolas, Verdana';
        d.style.zIndex = 999;
        d.style.margin = '-30px 0 0 -100px';
        d.style.fontSize = '20px';
        d.style.textAlign = 'center';
        d.className = 'nsi';
        document.body.appendChild(d);
        userInterface.gfxOverlay = d;
        if (window.lbf) window.lbf.innerHTML = '';
      } else {
        if (userInterface.gfxOverlay) {
          document.body.removeChild(userInterface.gfxOverlay);
          userInterface.gfxOverlay = undefined;
        }
      }
      userInterface.gfxEnabled = !userInterface.gfxEnabled;
    },

    savePreference: function(item, value) {
      window.localStorage.setItem(item, value);
      userInterface.onPrefChange();
    },

    loadPreference: function(preference, defaultVar) {
      var savedItem = window.localStorage.getItem(preference);
      if (savedItem !== null) {
        if (savedItem === 'true') window[preference] = true;
        else if (savedItem === 'false') window[preference] = false;
        else window[preference] = savedItem;
        console.log('Setting found for ' + preference + ': ' + window[preference]);
      } else {
        window[preference] = defaultVar;
        console.log('No setting found for ' + preference + '. Used default: ' + window[preference]);
      }
      userInterface.onPrefChange();
      return window[preference];
    },

    playButtonClickListener: function() {
      userInterface.saveNick();
      userInterface.loadPreference('autoRespawn', false);
      userInterface.onPrefChange();
      if (userInterface.server.value) {
        let s = userInterface.server.value.split(':');
        if (s.length === 2) {
          window.force_ip = s[0];
          window.force_port = s[1];
          bot.connect();
        }
      } else {
        window.force_ip = undefined;
        window.force_port = undefined;
      }
    },

    saveNick: function() {
      var nick = document.getElementById('nick')?.value || 'SlitherBot';
      userInterface.savePreference('savedNick', nick);
    },

    hideTop: function() {
      var nsidivs = document.querySelectorAll('div.nsi');
      for (var i = 0; i < nsidivs.length; i++) {
        if (nsidivs[i].style.top === '4px' && nsidivs[i].style.width === '300px') {
          nsidivs[i].style.visibility = 'hidden';
          bot.isTopHidden = true;
          window.topscore = nsidivs[i];
        }
      }
    },

    framesPerSecond: {
      fps: 0,
      fpsTimer: function() {
        if (window.playing && window.fps && window.lrd_mtm) {
          if (Date.now() - window.lrd_mtm > 970) {
            userInterface.framesPerSecond.fps = window.fps;
          }
        }
      }
    },

    onkeydown: function(e) {
      if (window.playing) {
        if (e.keyCode === 84) { // 'T' toggles bot
          bot.isBotEnabled = !bot.isBotEnabled;
          console.log('Bot enabled: ' + bot.isBotEnabled);
        }
        if (e.keyCode === 85) {
          window.logDebugging = !window.logDebugging;
          console.log('Log debugging: ' + window.logDebugging);
          userInterface.savePreference('logDebugging', window.logDebugging);
        }
        if (e.keyCode === 89) {
          window.visualDebugging = !window.visualDebugging;
          console.log('Visual debugging: ' + window.visualDebugging);
          userInterface.savePreference('visualDebugging', window.visualDebugging);
        }
        if (e.keyCode === 73) {
          window.autoRespawn = !window.autoRespawn;
          console.log('Auto respawn: ' + window.autoRespawn);
          userInterface.savePreference('autoRespawn', window.autoRespawn);
        }
        if (e.keyCode === 72) userInterface.toggleOverlays();
        if (e.keyCode === 71) userInterface.toggleGfx();
        if (e.keyCode === 79) userInterface.toggleMobileRendering(!window.mobileRender);
        if (e.keyCode === 65) {
          bot.opt.radiusMult++;
          console.log('radiusMult: ' + bot.opt.radiusMult);
        }
        if (e.keyCode === 83) {
          if (bot.opt.radiusMult > 1) {
            bot.opt.radiusMult--;
            console.log('radiusMult: ' + bot.opt.radiusMult);
          }
        }
        if (e.keyCode === 90) canvas.resetZoom?.();
        if (e.keyCode === 81) {
          window.autoRespawn = false;
          userInterface.quit();
        }
        if (e.keyCode === 27) bot.quickRespawn();
        userInterface.onPrefChange();
      }
      window.original_keydown?.(e);
    },

    onmousedown: function(e) {
      if (window.playing) {
        switch (e.which) {
          case 1:
            bot.defaultAccel = 1;
            if (!bot.isBotEnabled) window.original_onmouseDown?.(e);
            break;
          case 3:
            bot.isBotEnabled = !bot.isBotEnabled;
            console.log('Bot enabled: ' + bot.isBotEnabled);
            break;
        }
      } else {
        window.original_onmouseDown?.(e);
      }
      userInterface.onPrefChange();
    },

    onmouseup: function() {
      bot.defaultAccel = 0;
    },

    toggleMobileRendering: function(mobileRendering) {
      window.mobileRender = mobileRendering;
      console.log('Mobile rendering: ' + window.mobileRender);
      userInterface.savePreference('mobileRender', window.mobileRender);
      if (window.mobileRender) {
        window.render_mode = 1;
        window.want_quality = 0;
        window.high_quality = false;
      } else {
        window.render_mode = 2;
        window.want_quality = 1;
        window.high_quality = true;
      }
    },

    updateStats: function() {
      var oContent = [];
      if (bot.scores.length === 0) return;
      var median = Math.round((bot.scores[Math.floor((bot.scores.length - 1) / 2)] + bot.scores[Math.ceil((bot.scores.length - 1) / 2)]) / 2);
      oContent.push('games played: ' + bot.scores.length);
      oContent.push('a: ' + Math.round(bot.scores.reduce(function(a, b) { return a + b; }) / bot.scores.length) + ' m: ' + median);
      for (var i = 0; i < bot.scores.length && i < 10; i++) {
        oContent.push(i + 1 + '. ' + bot.scores[i]);
      }
      userInterface.overlays.statsOverlay.innerHTML = oContent.join('<br/>');
    },

    onPrefChange: function() {
      var oContent = [], ht = userInterface.handleTextColor;
      oContent.push('version: 1.0');
      oContent.push('[T] bot: ' + ht(bot.isBotEnabled));
      oContent.push('[O] mobile rendering: ' + ht(window.mobileRender));
      oContent.push('[A/S] radius multiplier: ' + bot.opt.radiusMult);
      oContent.push('[I] auto respawn: ' + ht(window.autoRespawn));
      oContent.push('[Y] visual debugging: ' + ht(window.visualDebugging));
      oContent.push('[U] log debugging: ' + ht(window.logDebugging));
      oContent.push('[Mouse Wheel] zoom');
      oContent.push('[Z] reset zoom');
      oContent.push('[ESC] quick respawn');
      oContent.push('[Q] quit to menu');
      userInterface.overlays.prefOverlay.innerHTML = oContent.join('<br/>');
    },

    onFrameUpdate: function() {
      if (window.playing && window.snake !== null) {
        let oContent = [
          'fps: ' + userInterface.framesPerSecond.fps,
          'x: ' + (Math.round(window.snake.xx) || 0) + ' y: ' + (Math.round(window.snake.yy) || 0)
        ];
        if (window.goalCoordinates) {
          oContent.push('target');
          oContent.push('x: ' + window.goalCoordinates.x + ' y: ' + window.goalCoordinates.y);
          if (window.goalCoordinates.sz) oContent.push('sz: ' + window.goalCoordinates.sz);
        }
        userInterface.overlays.botOverlay.innerHTML = oContent.join('<br/>');
        if (userInterface.gfxOverlay) {
          let gContent = [
            '<b>' + (window.snake.nk || 'Unknown') + '</b>',
            bot.snakeLength,
            '[' + (window.rank || 0) + '/' + (window.snake_count || 0) + ']'
          ];
          userInterface.gfxOverlay.innerHTML = gContent.join('<br/>');
        }
        if (window.bso !== undefined && userInterface.overlays.serverOverlay.innerHTML !== window.bso.ip + ':' + window.bso.po) {
          userInterface.overlays.serverOverlay.innerHTML = window.bso.ip + ':' + window.bso.po;
        }
      }
      if (window.playing && window.visualDebugging && window.goalCoordinates && bot.isBotEnabled) {
        var headCoord = { x: window.snake.xx, y: window.snake.yy };
        canvas.drawLine(headCoord, window.goalCoordinates, 'green');
        canvas.drawCircle(canvas.circle(window.goalCoordinates.x, window.goalCoordinates.y, 5), 'red', true);
      }
    },

    oefTimer: function() {
      var start = Date.now();
      canvas.maintainZoom?.();
      window.original_oef?.();
      if (userInterface.gfxEnabled) window.original_redraw?.();
      else window.visualDebugging = false;
      if (window.playing && bot.isBotEnabled && window.snake !== null) {
        window.onmousemove = function() {};
        bot.isBotRunning = true;
        bot.go();
      } else if (bot.isBotEnabled && bot.isBotRunning) {
        bot.isBotRunning = false;
        if (window.lastscore && window.lastscore.childNodes[1]) {
          bot.scores.push(parseInt(window.lastscore.childNodes[1].innerHTML));
          bot.scores.sort(function(a, b) { return b - a; });
          userInterface.updateStats();
        }
        if (window.autoRespawn) bot.connect();
      }
      if (!bot.isBotEnabled || !bot.isBotRunning) window.onmousemove = window.original_onmousemove;
      userInterface.onFrameUpdate();
      if (!bot.isBotEnabled && !window.no_raf) window.raf?.(userInterface.oefTimer);
      else setTimeout(userInterface.oefTimer, (1000 / bot.opt.targetFps) - (Date.now() - start));
    },

    quit: function() {
      if (window.playing && window.resetGame) {
        window.want_close_socket = true;
        window.dead_mtm = 0;
        if (window.play_btn) window.play_btn.setEnabled(true);
        window.resetGame();
      }
    },

    handleTextColor: function(enabled) {
      return '<span style="color:' + (enabled ? 'green;">enabled' : 'red;">disabled</span>');
    }
  };
  let isInGame = false; // Add this line at the very top of your script's IIFE (alongside other top-level variables like 'overlay')

  function interceptWebSocket() {
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = function (url) {
      console.log('Intercepting WebSocket connection to:', url);
      const ws = new OriginalWebSocket(url);

      ws.addEventListener('message', (event) => {
        // You can add logic here to process incoming messages if needed
        // For example, parsing game data, other snakes' positions, etc.
      });

      ws.addEventListener('open', () => {
        console.log('WebSocket opened!');
        isInGame = true; // Set flag when connection is open
        // Hide the connecting overlay if you have one
        if (overlay) overlay.style.display = 'none'; // Assuming 'overlay' is your connecting message div
      });

      ws.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
        isInGame = false;
        // Optionally, display an error message to the user
      });

      ws.addEventListener('close', (event) => {
        console.log('WebSocket closed: code ' + event.code + ', reason: ' + event.reason);
        isInGame = false;
        bot.isBotRunning = false; // Stop the bot logic if connection closes
        // Show the connecting overlay or main menu if needed
        if (overlay) overlay.style.display = 'flex';
      });

      // You might also need to keep a reference to this WebSocket instance
      // if you plan to send messages from your bot directly.
      // For example: window.botWebSocket = ws;

      return ws;
    };
    window.WebSocket.prototype = OriginalWebSocket.prototype; // Maintain prototype chain
  }
  
  // === Initialization ===
  window.original_keydown = document.onkeydown;
  window.original_onmouseDown = window.onmousedown;
  window.original_oef = window.oef;
  window.original_redraw = window.redraw;
  window.original_onmousemove = window.onmousemove;

  
  document.onkeydown = userInterface.onkeydown;
  window.onmousedown = userInterface.onmousedown;
  window.addEventListener('mouseup', userInterface.onmouseup);

  userInterface.hideTop();
  userInterface.initServerIp();
  if (userInterface.server) {
    userInterface.server.addEventListener('keyup', function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        window.play_btn?.btnf.click();
      }
    });
  }

  userInterface.initOverlays();

  userInterface.loadPreference('logDebugging', false);
  userInterface.loadPreference('visualDebugging', false);
  userInterface.loadPreference('autoRespawn', false);
  window.nick.value = userInterface.loadPreference('savedNick', 'SlitherBot');

  document.body.addEventListener('mousewheel', canvas.setZoom);
  document.body.addEventListener('DOMMouseScroll', canvas.setZoom);

  window.localStorage.setItem('edttsg', '1');

  if (window.social) window.social.remove();

  setInterval(userInterface.framesPerSecond.fpsTimer, 80);

  userInterface.oefTimer();

  if (window.play_btn?.btnf) {
    window.play_btn.btnf.addEventListener('click', userInterface.playButtonClickListener);
  }
})(window, document);