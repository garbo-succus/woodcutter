import { Shape, Vector2 } from "three";

export function cleanupShape(shape: Shape, cleanupMethod: number): Shape {
  switch (cleanupMethod) {
    case 0: // None
      return shape;
    case 1: // Normal
      return normalCleanup(shape);
    case 2: // Aggressive
      return aggressiveCleanup(shape);
    default:
      return shape;
  }
}

function normalCleanup(shape: Shape): Shape {
  const points = shape.getPoints();
  if (points.length === 0) return shape;

  // Remove duplicate consecutive points
  const deduped = removeDuplicatePoints(points);

  // Remove collinear points (points that lie on the same line)
  const simplified = removeCollinearPoints(deduped);

  // Apply Douglas-Peucker simplification
  const smoothed = douglasPeucker(simplified, 0.001);

  // Create new shape from cleaned points
  return createShapeFromPoints(smoothed);
}

function removeDuplicatePoints(
  points: Vector2[],
  tolerance: number = 0.0001,
): Vector2[] {
  if (points.length === 0) return points;

  const result = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];

    if (prev.distanceTo(curr) > tolerance) {
      result.push(curr);
    }
  }

  return result;
}

function removeCollinearPoints(
  points: Vector2[],
  tolerance: number = 0.001,
): Vector2[] {
  if (points.length <= 2) return points;

  const result = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Calculate cross product to determine if points are collinear
    const crossProduct = Math.abs(
      (curr.x - prev.x) * (next.y - prev.y) -
        (next.x - prev.x) * (curr.y - prev.y),
    );

    // If cross product is above tolerance, the point is not collinear
    if (crossProduct > tolerance) {
      result.push(curr);
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

function douglasPeucker(points: Vector2[], tolerance: number): Vector2[] {
  if (points.length <= 2) return points;

  // Find the point with maximum distance from the line between first and last points
  let maxDistance = 0;
  let maxIndex = 0;

  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = pointToLineDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If the maximum distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);

    // Combine results, removing the duplicate point at the connection
    return left.slice(0, -1).concat(right);
  } else {
    // All points are within tolerance, return just the endpoints
    return [start, end];
  }
}

function pointToLineDistance(
  point: Vector2,
  lineStart: Vector2,
  lineEnd: Vector2,
): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) return Math.sqrt(A * A + B * B);

  let param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function createShapeFromPoints(points: Vector2[]): Shape {
  const newShape = new Shape();

  if (points.length > 0) {
    newShape.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      newShape.lineTo(points[i].x, points[i].y);
    }
  }

  return newShape;
}

function aggressiveCleanup(shape: Shape): Shape {
  const points = shape.getPoints();
  if (points.length === 0) return shape;

  // First apply normal cleanup
  const normalCleaned = normalCleanup(shape);
  const cleanPoints = normalCleaned.getPoints();

  // Create outer contour using ray sampling
  const outerContour = createOuterContourByRaySampling(cleanPoints);

  // Run final normal cleanup to smooth the result
  return normalCleanup(createShapeFromPoints(outerContour));
}

function createOuterContourByRaySampling(points: Vector2[]): Vector2[] {
  if (points.length < 3) return points;

  // Calculate shape center and bounding radius
  const center = calculateShapeCenter(points);
  const maxRadius = calculateMaxRadius(points, center);
  
  // Sample rays at regular angular intervals
  const numRays = 360; // Number of rays to cast
  const rayStartRadius = maxRadius * 1.5; // Start rays outside the shape
  
  const contourPoints: Vector2[] = [];
  
  for (let i = 0; i < numRays; i++) {
    const angle = (i / numRays) * Math.PI * 2;
    
    // Calculate ray start point (outside the shape)
    const rayStart = new Vector2(
      center.x + Math.cos(angle) * rayStartRadius,
      center.y + Math.sin(angle) * rayStartRadius
    );
    
    // Cast ray toward center and find intersection with shape
    const intersection = findRayShapeIntersection(rayStart, center, points);
    
    if (intersection) {
      contourPoints.push(intersection);
    }
  }
  
  return contourPoints;
}

function calculateShapeCenter(points: Vector2[]): Vector2 {
  let sumX = 0, sumY = 0;
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }
  return new Vector2(sumX / points.length, sumY / points.length);
}

function calculateMaxRadius(points: Vector2[], center: Vector2): number {
  let maxDistance = 0;
  for (const point of points) {
    const distance = center.distanceTo(point);
    maxDistance = Math.max(maxDistance, distance);
  }
  return maxDistance;
}

function findRayShapeIntersection(rayStart: Vector2, rayEnd: Vector2, shapePoints: Vector2[]): Vector2 | null {
  let closestIntersection: Vector2 | null = null;
  let closestDistance = Infinity;
  
  // Check intersection with each edge of the shape
  for (let i = 0; i < shapePoints.length; i++) {
    const edgeStart = shapePoints[i];
    const edgeEnd = shapePoints[(i + 1) % shapePoints.length];
    
    const intersection = lineIntersection(rayStart, rayEnd, edgeStart, edgeEnd);
    
    if (intersection) {
      // Check if intersection is on the ray (between rayStart and rayEnd)
      const rayDirection = new Vector2(rayEnd.x - rayStart.x, rayEnd.y - rayStart.y);
      const toIntersection = new Vector2(intersection.x - rayStart.x, intersection.y - rayStart.y);
      
      // Ensure intersection is in the direction of the ray
      if (rayDirection.dot(toIntersection) >= 0) {
        const distance = rayStart.distanceTo(intersection);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIntersection = intersection;
        }
      }
    }
  }
  
  return closestIntersection;
}

function lineIntersection(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2): Vector2 | null {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;
  const x4 = p4.x, y4 = p4.y;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  
  if (Math.abs(denom) < 1e-10) {
    return null; // Lines are parallel
  }
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  
  // Check if intersection is within both line segments
  if (u >= 0 && u <= 1) {
    const x = x1 + t * (x2 - x1);
    const y = y1 + t * (y2 - y1);
    return new Vector2(x, y);
  }
  
  return null;
}

function createTriangleShape(): Shape {
  const triangleShape = new Shape();
  triangleShape.moveTo(0, 0.5);
  triangleShape.lineTo(-0.5, -0.5);
  triangleShape.lineTo(0.5, -0.5);
  triangleShape.lineTo(0, 0.5);
  return triangleShape;
}
