/**
 * This file was auto-generated by Fern from our API Definition.
 */

package resources.errors.exceptions;

import com.fasterxml.jackson.annotation.JsonValue;
import core.APIException;
import resources.errors.types.UnauthorizedRequestErrorBody;

public final class UnauthorizedRequest extends APIException {
  public static final int STATUS_CODE = 401;

  private final UnauthorizedRequestErrorBody body;

  public UnauthorizedRequest(UnauthorizedRequestErrorBody body) {
    this.body = body;
  }

  @JsonValue
  public UnauthorizedRequestErrorBody getBody() {
    return this.body;
  }
}